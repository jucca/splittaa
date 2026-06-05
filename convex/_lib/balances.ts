import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { SupportedCurrencyCode } from "./currencies";
import { DEFAULT_CURRENCY } from "./currencies";
import { balanceCurrency, convertWithStoredRates } from "./exchange";

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

async function findBalanceRow(
  ctx: BalanceReader,
  scope: Scope,
  userId: Id<"users">,
  counterpartyUserId: Id<"users">,
  currency: SupportedCurrencyCode
): Promise<Doc<"balances"> | null> {
  const rows = await ctx.db
    .query("balances")
    .withIndex("by_scope_pair_currency", (q) =>
      q
        .eq("scopeType", scope.scopeType)
        .eq("scopeGroupId", scope.scopeGroupId)
        .eq("userId", userId)
        .eq("counterpartyUserId", counterpartyUserId)
        .eq("currency", currency)
    )
    .collect();

  if (rows.length > 0) return rows[0]!;

  if (currency === DEFAULT_CURRENCY) {
    const legacy = await ctx.db
      .query("balances")
      .withIndex("by_scope_pair", (q) =>
        q
          .eq("scopeType", scope.scopeType)
          .eq("scopeGroupId", scope.scopeGroupId)
          .eq("userId", userId)
          .eq("counterpartyUserId", counterpartyUserId)
      )
      .collect();
    const legacyRow = legacy.find((r) => !r.currency || r.currency === DEFAULT_CURRENCY);
    return legacyRow ?? null;
  }

  return null;
}

async function upsertCanonicalBalance(
  ctx: BalanceWriter,
  scope: Scope,
  userId: Id<"users">,
  counterpartyUserId: Id<"users">,
  currency: SupportedCurrencyCode,
  nextAmount: number
) {
  const existing = await findBalanceRow(
    ctx,
    scope,
    userId,
    counterpartyUserId,
    currency
  );

  const rounded = Math.round(nextAmount * 100) / 100;
  if (Math.abs(rounded) < 0.005) {
    if (existing) await ctx.db.delete(existing._id);
    return;
  }

  const payload = {
    amount: rounded,
    currency,
    updatedAt: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, payload);
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
  currency: SupportedCurrencyCode,
  amount: number
) {
  if (amount <= 0 || fromUserId === toUserId) return;

  const canonical = normalizeDirection(fromUserId, toUserId);
  const existing = await findBalanceRow(
    ctx,
    scope,
    canonical.userId,
    canonical.counterpartyUserId,
    currency
  );

  const currentAmount = existing?.amount ?? 0;
  const signedDelta = canonical.direction === 1 ? amount : -amount;
  const nextAmount = currentAmount + signedDelta;

  await upsertCanonicalBalance(
    ctx,
    scope,
    canonical.userId,
    canonical.counterpartyUserId,
    currency,
    nextAmount
  );
}

export async function applyExpenseToBalances(
  ctx: BalanceWriter,
  expense: {
    paidByUserId: Id<"users">;
    groupId?: Id<"groups">;
    currency: SupportedCurrencyCode;
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
        expense.currency,
        amount
      );
    } else if (amount < 0) {
      await applyPairDelta(
        ctx,
        scope,
        expense.paidByUserId,
        split.userId,
        expense.currency,
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
    currency: SupportedCurrencyCode;
    groupId?: Id<"groups">;
  },
  factor: 1 | -1
) {
  const scope: Scope = settlement.groupId
    ? { scopeType: "group", scopeGroupId: settlement.groupId }
    : { scopeType: "personal" };

  const canonical = normalizeDirection(
    settlement.paidByUserId,
    settlement.receivedByUserId
  );

  const rows = await ctx.db
    .query("balances")
    .withIndex("by_scope_pair", (q) =>
      q
        .eq("scopeType", scope.scopeType)
        .eq("scopeGroupId", scope.scopeGroupId)
        .eq("userId", canonical.userId)
        .eq("counterpartyUserId", canonical.counterpartyUserId)
    )
    .collect();

  const activeRows = rows.filter((r) => Math.abs(r.amount) >= 0.005);
  const targetRow =
    activeRows.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0] ??
    null;

  const balanceCur = targetRow
    ? balanceCurrency(targetRow)
    : settlement.currency;

  let amountInBalanceCurrency = settlement.amount;
  if (settlement.currency !== balanceCur) {
    amountInBalanceCurrency = await convertWithStoredRates(
      ctx,
      settlement.amount,
      settlement.currency,
      balanceCur
    );
  }

  const amount = amountInBalanceCurrency * factor;
  if (amount > 0) {
    await applyPairDelta(
      ctx,
      scope,
      settlement.receivedByUserId,
      settlement.paidByUserId,
      balanceCur,
      amount
    );
  } else if (amount < 0) {
    await applyPairDelta(
      ctx,
      scope,
      settlement.paidByUserId,
      settlement.receivedByUserId,
      balanceCur,
      Math.abs(amount)
    );
  }
}

export async function listBalancesBetweenUsers(
  ctx: BalanceReader,
  meId: Id<"users">,
  otherId: Id<"users">,
  scope: Scope = { scopeType: "personal" }
) {
  const canonical = normalizeDirection(meId, otherId);
  const rows = await ctx.db
    .query("balances")
    .withIndex("by_scope_pair", (q) =>
      q
        .eq("scopeType", scope.scopeType)
        .eq("scopeGroupId", scope.scopeGroupId)
        .eq("userId", canonical.userId)
        .eq("counterpartyUserId", canonical.counterpartyUserId)
    )
    .collect();

  return rows
    .filter((r) => Math.abs(r.amount) >= 0.005)
    .map((r) => {
      const currency = balanceCurrency(r);
      const signed =
        canonical.userId === meId ? -r.amount : r.amount;
      return { currency, amount: signed };
    });
}

export async function getNetBalanceBetweenUsers(
  ctx: BalanceReader,
  meId: Id<"users">,
  otherId: Id<"users">
) {
  const parts = await listBalancesBetweenUsers(ctx, meId, otherId);
  if (parts.length === 0) return 0;
  if (parts.length === 1) return parts[0]!.amount;
  return parts[0]!.amount;
}
