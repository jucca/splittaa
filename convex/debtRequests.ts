import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuth } from "./_lib/auth";
import { getAmountDebtorOwesCreditor } from "./_lib/debtRequests";
import { sendDebtRequestForCreditor } from "./_lib/sendDebtRequest";
import { deliverDebtRequestPaidNotification } from "./_lib/notifications";
import { normalizeBalanceSettings } from "./_lib/balanceSettings";
import { computeGlobalBalanceByCounterparty } from "./_lib/globalBalance";
import { viewerCurrency } from "./_lib/moneyDisplay";
import {
  applySettlementToBalances,
  listBalancesBetweenUsers,
} from "./_lib/balances";
import { resolveCurrency, type SupportedCurrencyCode } from "./_lib/currencies";
import { convertWithStoredRates } from "./_lib/exchange";
export const sendDebtRequest = mutation({
  args: {
    debtorUserId: v.id("users"),
    groupId: v.optional(v.id("groups")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const creditor = await requireAuth(ctx);

    const result = await sendDebtRequestForCreditor(ctx, creditor, {
      debtorUserId: args.debtorUserId,
      groupId: args.groupId,
      message: args.message,
    });

    if (result.status === "skipped") {
      if (result.reason === "not_found") {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Velallista ei löytynyt",
        });
      }
      if (result.reason === "no_debt") {
        throw new ConvexError({
          code: "INVALID_STATE",
          message: "Tällä hetkellä ei ole avointa velkaa, jota voisi pyytää",
        });
      }
      throw new ConvexError({
        code: "COOLDOWN",
        message:
          "Velkapyyntö on jo lähetetty tälle henkilölle viimeisen 24 tunnin aikana.",
      });
    }

    return { success: true as const, amount: result.amount };
  },
});

/** Send personal-scope debt requests to everyone who owes the creditor (Saldotiedot). */
export const sendDebtRequestsBulk = mutation({
  args: {
    message: v.optional(v.string()),
  },
  returns: v.object({
    sent: v.number(),
    skippedCooldown: v.number(),
    skippedNoDebt: v.number(),
  }),
  handler: async (ctx, args) => {
    const creditor = await requireAuth(ctx);
    const viewerCur = viewerCurrency(creditor);
    const { autoNetBalances } = normalizeBalanceSettings(
      creditor.balanceSettings ?? undefined
    );
    const ledger = await computeGlobalBalanceByCounterparty(
      ctx,
      creditor._id,
      viewerCur,
      autoNetBalances
    );

    let sent = 0;
    let skippedCooldown = 0;
    let skippedNoDebt = 0;

    for (const [counterpartyId, owed] of ledger) {
      if (owed >= -0.005) continue;

      const result = await sendDebtRequestForCreditor(ctx, creditor, {
        debtorUserId: counterpartyId,
        message: args.message,
        skipCooldown: true,
      });

      if (result.status === "sent") {
        sent += 1;
      } else if (result.reason === "cooldown") {
        skippedCooldown += 1;
      } else if (result.reason === "no_debt") {
        skippedNoDebt += 1;
      }
    }

    return { sent, skippedCooldown, skippedNoDebt };
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
    const { amount: currentOwed } = await getAmountDebtorOwesCreditor(
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

    const balanceParts = await listBalancesBetweenUsers(
      ctx,
      debtor._id,
      creditorId,
      groupId
        ? { scopeType: "group", scopeGroupId: groupId }
        : { scopeType: "personal" }
    );
    const primaryDebt = balanceParts
      .filter((p) => p.amount < 0)
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];
    const debtCurrency = (primaryDebt?.currency ??
      "EUR") as SupportedCurrencyCode;
    const requested = notification.debtRequestAmount ?? currentOwed;
    const amountInDebtCurrency = Math.min(requested, currentOwed);
    const settlementCurrency = resolveCurrency(debtor.preferredCurrency);
    const amount = await convertWithStoredRates(
      ctx,
      amountInDebtCurrency,
      debtCurrency,
      settlementCurrency
    );

    const settlementId = await ctx.db.insert("settlements", {
      amount,
      currency: settlementCurrency,
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
        currency: settlementCurrency,
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
      amountCurrency: settlementCurrency,
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
