import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getNetBalanceBetweenUsers } from "./balances";
import { assertGroupMember } from "./authorize";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function getAmountDebtorOwesCreditor(
  ctx: QueryCtx | MutationCtx,
  creditorId: Id<"users">,
  debtorId: Id<"users">,
  groupId?: Id<"groups">
): Promise<number> {
  if (groupId) {
    await assertGroupMember(ctx, groupId, creditorId);
    await assertGroupMember(ctx, groupId, debtorId);

    const rows = await ctx.db
      .query("balances")
      .withIndex("by_scope_pair", (q) =>
        q
          .eq("scopeType", "group")
          .eq("scopeGroupId", groupId)
          .eq("userId", debtorId)
          .eq("counterpartyUserId", creditorId)
      )
      .collect();

    const owed = rows[0]?.amount ?? 0;
    return owed > 0 ? Math.round(owed * 100) / 100 : 0;
  }

  const net = await getNetBalanceBetweenUsers(ctx, creditorId, debtorId);
  return net > 0 ? Math.round(net * 100) / 100 : 0;
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

export async function assertDebtRequestCooldown(
  ctx: MutationCtx,
  debtorId: Id<"users">,
  dedupeKey: string
): Promise<void> {
  const existing = await ctx.db
    .query("notifications")
    .withIndex("by_user_dedupe", (q) =>
      q.eq("userId", debtorId).eq("dedupeKey", dedupeKey)
    )
    .first();

  if (existing && Date.now() - existing.createdAt < COOLDOWN_MS) {
    throw new ConvexError({
      code: "COOLDOWN",
      message:
        "Velkapyyntö on jo lähetetty tälle henkilölle viimeisen 24 tunnin aikana.",
    });
  }
}
