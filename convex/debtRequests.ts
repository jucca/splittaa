import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuth } from "./_lib/auth";
import {
  assertDebtRequestCooldown,
  debtRequestDedupeKey,
  getAmountDebtorOwesCreditor,
} from "./_lib/debtRequests";
import {
  deliverDebtRequestNotification,
  deliverDebtRequestPaidNotification,
} from "./_lib/notifications";
import { applySettlementToBalances } from "./_lib/balances";
import { getSiteUrlFromEnv } from "./_lib/invites";
import { internal } from "./_generated/api";
const MAX_MESSAGE_LENGTH = 500;

export const sendDebtRequest = mutation({
  args: {
    debtorUserId: v.id("users"),
    groupId: v.optional(v.id("groups")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const creditor = await requireAuth(ctx);

    if (creditor._id === args.debtorUserId) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Et voi lähettää velkapyyntöä itsellesi",
      });
    }

    const debtor = await ctx.db.get(args.debtorUserId);
    if (!debtor) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Velallista ei löytynyt",
      });
    }

    const amount = await getAmountDebtorOwesCreditor(
      ctx,
      creditor._id,
      args.debtorUserId,
      args.groupId
    );

    if (amount <= 0) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Tällä hetkellä ei ole avointa velkaa, jota voisi pyytää",
      });
    }

    const now = Date.now();
    const dedupeKey = debtRequestDedupeKey(
      creditor._id,
      args.debtorUserId,
      args.groupId,
      now
    );
    await assertDebtRequestCooldown(ctx, args.debtorUserId, dedupeKey);

    const message = args.message?.trim().slice(0, MAX_MESSAGE_LENGTH);
    let groupName: string | undefined;
    let href: string;

    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      groupName = group?.name;
      href = `/groups/${args.groupId}`;
    } else {
      href = `/person/${creditor._id}`;
    }

    await deliverDebtRequestNotification(ctx, {
      debtorUserId: args.debtorUserId,
      creditorId: creditor._id,
      creditorName: creditor.name,
      amount,
      href,
      dedupeKey,
      message,
      groupName,
      groupId: args.groupId,
    });

    const siteUrl = getSiteUrlFromEnv();
    if (debtor.email) {
      await ctx.scheduler.runAfter(0, internal.email.sendDebtRequestEmail, {
        to: debtor.email,
        debtorName: debtor.name,
        creditorName: creditor.name,
        amount,
        groupName: groupName ?? null,
        message: message ?? null,
        actionUrl: `${siteUrl}${href}`,
      });
    }

    return { success: true as const, amount };
  },
});

/** Debtor marks a debt request as paid — records settlement and notifies creditor. */
export const respondToDebtRequest = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const debtor = await requireAuth(ctx);
    const notification = await ctx.db.get(notificationId);

    if (!notification) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Viestiä ei löytynyt",
      });
    }
    if (notification.userId !== debtor._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Voit vastata vain omiin viesteihisi",
      });
    }
    if (notification.type !== "debt_request") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Tähän viestiin ei voi vastata tällä tavalla",
      });
    }
    if (notification.debtRequestRespondedAt) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Olet jo vastannut tähän velkapyyntöön",
      });
    }
    const creditorId = notification.debtRequestCreditorId;
    if (!creditorId) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Velkapyyntö on puutteellinen",
      });
    }

    const groupId = notification.debtRequestGroupId;
    const currentOwed = await getAmountDebtorOwesCreditor(
      ctx,
      creditorId,
      debtor._id,
      groupId
    );

    const respondedAt = Date.now();

    if (currentOwed <= 0) {
      await ctx.db.patch(notificationId, {
        isRead: true,
        debtRequestRespondedAt: respondedAt,
      });
      throw new ConvexError({
        code: "ALREADY_SETTLED",
        message: "Velka on jo maksettu. Viesti merkitty käsitellyksi.",
      });
    }

    const requested = notification.debtRequestAmount ?? currentOwed;
    const amount = Math.min(requested, currentOwed);

    const settlementId = await ctx.db.insert("settlements", {
      amount,
      note: "Velkapyyntö – merkitty maksetuksi viestistä",
      date: respondedAt,
      paidByUserId: debtor._id,
      receivedByUserId: creditorId,
      groupId,
      createdBy: debtor._id,
    });

    await applySettlementToBalances(
      ctx,
      {
        paidByUserId: debtor._id,
        receivedByUserId: creditorId,
        amount,
        groupId,
      },
      1
    );

    await ctx.db.patch(notificationId, {
      isRead: true,
      debtRequestRespondedAt: respondedAt,
    });

    const creditor = await ctx.db.get(creditorId);
    const group = groupId ? await ctx.db.get(groupId) : null;
    const creditorHref = groupId
      ? `/groups/${groupId}`
      : `/person/${debtor._id}`;

    await deliverDebtRequestPaidNotification(ctx, {
      creditorUserId: creditorId,
      debtorName: debtor.name,
      amount,
      href: creditorHref,
      groupName: group?.name,
    });

    return {
      success: true as const,
      settlementId,
      amount,
      creditorName: creditor?.name ?? "Tuntematon",
    };
  },
});
