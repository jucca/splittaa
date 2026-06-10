import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  assertDebtRequestCooldown,
  debtRequestDedupeKey,
  getAmountDebtorOwesCreditor,
  isDebtRequestOnCooldown,
} from "./debtRequests";
import type { SupportedCurrencyCode } from "./currencies";
import { deliverDebtRequestNotification } from "./notifications";
import { getSiteUrlFromEnv } from "./invites";

const MAX_MESSAGE_LENGTH = 500;

export type SendDebtRequestResult =
  | { status: "sent"; amount: number }
  | { status: "skipped"; reason: "cooldown" | "no_debt" | "not_found" };

export async function sendDebtRequestForCreditor(
  ctx: MutationCtx,
  creditor: Doc<"users">,
  args: {
    debtorUserId: Id<"users">;
    groupId?: Id<"groups">;
    message?: string;
    skipCooldown?: boolean;
    resolvedAmount?: { amount: number; currency: SupportedCurrencyCode };
  }
): Promise<SendDebtRequestResult> {
  if (creditor._id === args.debtorUserId) {
    throw new ConvexError({
      code: "INVALID_STATE",
      message: "Et voi lähettää velkapyyntöä itsellesi",
    });
  }

  const debtor = await ctx.db.get(args.debtorUserId);
  if (!debtor) {
    return { status: "skipped", reason: "not_found" };
  }

  const { amount, currency: amountCurrency } = args.resolvedAmount
    ? args.resolvedAmount
    : await getAmountDebtorOwesCreditor(
        ctx,
        creditor._id,
        args.debtorUserId,
        args.groupId
      );

  if (amount <= 0) {
    return { status: "skipped", reason: "no_debt" };
  }

  const now = Date.now();
  const dedupeKey = debtRequestDedupeKey(
    creditor._id,
    args.debtorUserId,
    args.groupId,
    now
  );

  if (args.skipCooldown) {
    if (await isDebtRequestOnCooldown(ctx, args.debtorUserId, dedupeKey)) {
      return { status: "skipped", reason: "cooldown" };
    }
  } else {
    await assertDebtRequestCooldown(ctx, args.debtorUserId, dedupeKey);
  }

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
    amountCurrency,
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

  return { status: "sent", amount };
}
