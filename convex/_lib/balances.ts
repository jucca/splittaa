import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Scope = {
  scopeType: "personal" | "group";
  scopeGroupId?: Id<"groups">;
};

type BalanceReader = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;
type BalanceWriter = Pick<MutationCtx, "db">;

function normalizeDirection(
  fromUserId: Id<"users">,
  toUserId: Id<"users">
): { userId: Id<"users">; counterpartyUserId: Id<"users">; direction: 1 | -1 } {
  if (fromUserId < toUserId) {
    return { userId: fromUserId, counterpartyUserId: toUserId, direction: 1 };
  }
  return { userId: toUserId, counterpartyUserId: fromUserId, direction: -1 };
}

async function upsertCanonicalBalance(
  ctx: BalanceWriter,
  scope: Scope,
  userId: Id<"users">,
  counterpartyUserId: Id<"users">,
  nextAmount: number
) {
  const existing: Doc<"balances">[] = await ctx.db
    .query("balances")
    .withIndex("by_scope_pair", (q) =>
      q
        .eq("scopeType", scope.scopeType)
        .eq("scopeGroupId", scope.scopeGroupId)
        .eq("userId", userId)
        .eq("counterpartyUserId", counterpartyUserId)
    )
    .collect();

  const rounded = Math.round(nextAmount * 100) / 100;
  if (Math.abs(rounded) < 0.005) {
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
    return;
  }

  const payload = {
    amount: rounded,
    updatedAt: Date.now(),
  };

  if (existing.length > 0) {
    await ctx.db.patch(existing[0]._id, payload);
    for (const row of existing.slice(1)) {
      await ctx.db.delete(row._id);
    }
    return;
  }

  await ctx.db.insert("balances", {
    scopeType: scope.scopeType,
    scopeGroupId: scope.scopeGroupId,
    userId,
    counterpartyUserId,
    ...payload,
  });
}

export async function applyPairDelta(
  ctx: BalanceWriter,
  scope: Scope,
  fromUserId: Id<"users">,
  toUserId: Id<"users">,
  amount: number
) {
  if (amount <= 0 || fromUserId === toUserId) return;

  const canonical = normalizeDirection(fromUserId, toUserId);
  const existing: Doc<"balances">[] = await ctx.db
    .query("balances")
    .withIndex("by_scope_pair", (q) =>
      q
        .eq("scopeType", scope.scopeType)
        .eq("scopeGroupId", scope.scopeGroupId)
        .eq("userId", canonical.userId)
        .eq("counterpartyUserId", canonical.counterpartyUserId)
    )
    .collect();

  const currentAmount = existing[0]?.amount ?? 0;
  const signedDelta = canonical.direction === 1 ? amount : -amount;
  const nextAmount = currentAmount + signedDelta;

  await upsertCanonicalBalance(
    ctx,
    scope,
    canonical.userId,
    canonical.counterpartyUserId,
    nextAmount
  );
}

export async function applyExpenseToBalances(
  ctx: BalanceWriter,
  expense: {
    paidByUserId: Id<"users">;
    groupId?: Id<"groups">;
    splits: { userId: Id<"users">; amount: number; paid: boolean }[];
  },
  factor: 1 | -1
) {
  const scope: Scope = expense.groupId
    ? { scopeType: "group", scopeGroupId: expense.groupId }
    : { scopeType: "personal" };

  for (const split of expense.splits) {
    if (split.paid || split.userId === expense.paidByUserId) continue;
    const amount = split.amount * factor;
    if (amount > 0) {
      await applyPairDelta(
        ctx,
        scope,
        split.userId,
        expense.paidByUserId,
        amount
      );
    } else if (amount < 0) {
      await applyPairDelta(
        ctx,
        scope,
        expense.paidByUserId,
        split.userId,
        Math.abs(amount)
      );
    }
  }
}

export async function applySettlementToBalances(
  ctx: BalanceWriter,
  settlement: {
    paidByUserId: Id<"users">;
    receivedByUserId: Id<"users">;
    amount: number;
    groupId?: Id<"groups">;
  },
  factor: 1 | -1
) {
  const scope: Scope = settlement.groupId
    ? { scopeType: "group", scopeGroupId: settlement.groupId }
    : { scopeType: "personal" };

  // Settlement paidBy -> receivedBy reduces paidBy's debt.
  const amount = settlement.amount * factor;
  if (amount > 0) {
    await applyPairDelta(
      ctx,
      scope,
      settlement.receivedByUserId,
      settlement.paidByUserId,
      amount
    );
  } else if (amount < 0) {
    await applyPairDelta(
      ctx,
      scope,
      settlement.paidByUserId,
      settlement.receivedByUserId,
      Math.abs(amount)
    );
  }
}

export async function getNetBalanceBetweenUsers(
  ctx: BalanceReader,
  meId: Id<"users">,
  otherId: Id<"users">
) {
  const canonical = normalizeDirection(meId, otherId);
  const rows: Doc<"balances">[] = await ctx.db
    .query("balances")
    .withIndex("by_scope_pair", (q) =>
      q
        .eq("scopeType", "personal")
        .eq("scopeGroupId", undefined)
        .eq("userId", canonical.userId)
        .eq("counterpartyUserId", canonical.counterpartyUserId)
    )
    .collect();
  const amount = rows[0]?.amount ?? 0;
  return canonical.userId === meId ? -amount : amount;
}

