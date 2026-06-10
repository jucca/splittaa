import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { normalizeBalanceSettings } from "./balanceSettings";
import { listBalancesBetweenUsers } from "./balances";
import { computeGlobalNetBetweenUsers } from "./globalBalance";
import { viewerCurrency } from "./moneyDisplay";
import { assertGroupMember } from "./authorize";
import type { SupportedCurrencyCode } from "./currencies";
import { DEFAULT_CURRENCY } from "./currencies";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function getAmountDebtorOwesCreditor(
  ctx: QueryCtx | MutationCtx,
  creditorId: Id<"users">,
  debtorId: Id<"users">,
  groupId?: Id<"groups">
): Promise<{ amount: number; currency: SupportedCurrencyCode }> {
  const scope = groupId
    ? { scopeType: "group" as const, scopeGroupId: groupId }
    : { scopeType: "personal" as const };

  if (groupId) {
    await assertGroupMember(ctx, groupId, creditorId);
    await assertGroupMember(ctx, groupId, debtorId);
  }

  if (groupId) {
    const parts = await listBalancesBetweenUsers(
      ctx,
      creditorId,
      debtorId,
      scope
    );
    const owedParts = parts.filter((p) => p.amount > 0);
    if (owedParts.length === 0) {
      return { amount: 0, currency: DEFAULT_CURRENCY };
    }
    const primary = owedParts.sort(
      (a, b) => Math.abs(b.amount) - Math.abs(a.amount)
    )[0]!;
    return {
      amount: Math.round(primary.amount * 100) / 100,
      currency: primary.currency,
    };
  }

  const creditor = await ctx.db.get(creditorId);
  const viewerCur = viewerCurrency(creditor ?? {});
  const { autoNetBalances } = normalizeBalanceSettings(
    creditor?.balanceSettings ?? undefined
  );
  const net = await computeGlobalNetBetweenUsers(
    ctx,
    creditorId,
    debtorId,
    viewerCur,
    autoNetBalances
  );
  return {
    amount: net > 0 ? Math.round(net * 100) / 100 : 0,
    currency: viewerCur,
  };
}

export function debtRequestDedupeKey(
  creditorId: Id<"users">,
  debtorId: Id<"users">,
  groupId: Id<"groups"> | undefined,
  at: number
): string {
  const day = new Date(at).toISOString().slice(0, 10);
  const scope = groupId ?? "personal";
  return `debt_request:${creditorId}:${debtorId}:${scope}:${day}`;
}

export async function isDebtRequestOnCooldown(
  ctx: MutationCtx,
  debtorId: Id<"users">,
  dedupeKey: string
): Promise<boolean> {
  const existing = await ctx.db
    .query("notifications")
    .withIndex("by_user_dedupe", (q) =>
      q.eq("userId", debtorId).eq("dedupeKey", dedupeKey)
    )
    .first();

  return !!(existing && Date.now() - existing.createdAt < COOLDOWN_MS);
}

export async function assertDebtRequestCooldown(
  ctx: MutationCtx,
  debtorId: Id<"users">,
  dedupeKey: string
): Promise<void> {
  if (await isDebtRequestOnCooldown(ctx, debtorId, dedupeKey)) {
    throw new ConvexError({
      code: "COOLDOWN",
      message:
        "Velkapyyntö on jo lähetetty tälle henkilölle viimeisen 24 tunnin aikana.",
    });
  }
}
