import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { formatCurrency } from "../../lib/utils";

type DebtRow = { name: string; amount: number };

export async function upsertNotification(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    type:
      | "group_invite"
      | "balance_reminder"
      | "debt_request"
      | "debt_request_paid";
    title: string;
    body: string;
    href?: string;
    relatedInviteId?: Id<"groupInvites">;
    dedupeKey?: string;
    createdAt?: number;
    debtRequestCreditorId?: Id<"users">;
    debtRequestAmount?: number;
    debtRequestGroupId?: Id<"groups">;
    debtRequestRespondedAt?: number;
  }
): Promise<Id<"notifications">> {
  const createdAt = args.createdAt ?? Date.now();

  if (args.dedupeKey) {
    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_user_dedupe", (q) =>
        q.eq("userId", args.userId).eq("dedupeKey", args.dedupeKey)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        body: args.body,
        href: args.href,
        isRead: false,
        createdAt,
        relatedInviteId: args.relatedInviteId,
        debtRequestCreditorId: args.debtRequestCreditorId,
        debtRequestAmount: args.debtRequestAmount,
        debtRequestGroupId: args.debtRequestGroupId,
        debtRequestRespondedAt: args.debtRequestRespondedAt,
      });
      return existing._id;
    }
  }

  return await ctx.db.insert("notifications", {
    userId: args.userId,
    type: args.type,
    title: args.title,
    body: args.body,
    href: args.href,
    isRead: false,
    createdAt,
    relatedInviteId: args.relatedInviteId,
    dedupeKey: args.dedupeKey,
    debtRequestCreditorId: args.debtRequestCreditorId,
    debtRequestAmount: args.debtRequestAmount,
    debtRequestGroupId: args.debtRequestGroupId,
    debtRequestRespondedAt: args.debtRequestRespondedAt,
  });
}

export async function deliverGroupInviteNotification(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    inviteId: Id<"groupInvites">;
    groupName: string;
    inviterName: string;
    token: string;
  }
): Promise<void> {
  await upsertNotification(ctx, {
    userId: args.userId,
    type: "group_invite",
    title: `Kutsu ryhmään: ${args.groupName}`,
    body: `${args.inviterName} kutsui sinut ryhmään ${args.groupName}. Hyväksy tai hylkää kutsu viimeistään 7 päivän kuluessa.`,
    href: `/join/${args.token}`,
    relatedInviteId: args.inviteId,
    dedupeKey: `group_invite:${args.inviteId}`,
  });
}

export function buildBalanceReminderBody(
  iOwe: DebtRow[],
  owedToMe: DebtRow[]
): string {
  const parts: string[] = [];
  if (iOwe.length > 0) {
    const lines = iOwe
      .slice(0, 5)
      .map((d) => `${d.name}: ${formatCurrency(d.amount)}`)
      .join(", ");
    parts.push(
      `Olet velkaa ${iOwe.length} henkilölle${iOwe.length > 5 ? " (esim.)" : ""}: ${lines}.`
    );
  }
  if (owedToMe.length > 0) {
    const lines = owedToMe
      .slice(0, 5)
      .map((d) => `${d.name}: ${formatCurrency(d.amount)}`)
      .join(", ");
    parts.push(
      `Sinulle ollaan velkaa ${owedToMe.length} henkilöltä${owedToMe.length > 5 ? " (esim.)" : ""}: ${lines}.`
    );
  }
  return parts.join(" ");
}

export async function deliverBalanceReminderNotification(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    sentAt: number;
    iOwe: DebtRow[];
    owedToMe: DebtRow[];
  }
): Promise<void> {
  const day = new Date(args.sentAt).toISOString().slice(0, 10);
  const body = buildBalanceReminderBody(args.iOwe, args.owedToMe);
  if (!body) return;

  await upsertNotification(ctx, {
    userId: args.userId,
    type: "balance_reminder",
    title: "Saldomuistutus",
    body,
    href: "/dashboard",
    dedupeKey: `balance_reminder:${args.userId}:${day}`,
    createdAt: args.sentAt,
  });
}

export async function deliverDebtRequestNotification(
  ctx: MutationCtx,
  args: {
    debtorUserId: Id<"users">;
    creditorId: Id<"users">;
    creditorName: string;
    amount: number;
    href: string;
    dedupeKey: string;
    message?: string;
    groupName?: string;
    groupId?: Id<"groups">;
  }
): Promise<void> {
  const context = args.groupName
    ? ` ryhmässä ${args.groupName}`
    : " henkilökohtaisessa jaossa";
  const extra = args.message?.trim()
    ? ` Viesti: «${args.message.trim().slice(0, 500)}»`
    : "";

  await upsertNotification(ctx, {
    userId: args.debtorUserId,
    type: "debt_request",
    title: "Velkapyyntö",
    body: `${args.creditorName} pyytää sinua maksamaan ${formatCurrency(args.amount)}${context}.${extra}`,
    href: args.href,
    dedupeKey: args.dedupeKey,
    debtRequestCreditorId: args.creditorId,
    debtRequestAmount: args.amount,
    debtRequestGroupId: args.groupId,
  });
}

export async function deliverDebtRequestPaidNotification(
  ctx: MutationCtx,
  args: {
    creditorUserId: Id<"users">;
    debtorName: string;
    amount: number;
    href: string;
    groupName?: string;
  }
): Promise<void> {
  const context = args.groupName ? ` ryhmässä ${args.groupName}` : "";
  await upsertNotification(ctx, {
    userId: args.creditorUserId,
    type: "debt_request_paid",
    title: "Velkapyyntö maksettu",
    body: `${args.debtorName} merkitsi velkapyyntösi maksetuksi (${formatCurrency(args.amount)}${context}).`,
    href: args.href,
    dedupeKey: `debt_request_paid:${args.creditorUserId}:${Date.now()}`,
  });
}

export async function markInviteNotificationsRead(
  ctx: MutationCtx,
  inviteId: Id<"groupInvites">
): Promise<void> {
  const notifications = await ctx.db
    .query("notifications")
    .filter((q) => q.eq(q.field("relatedInviteId"), inviteId))
    .collect();

  for (const notification of notifications) {
    if (!notification.isRead) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  }
}
