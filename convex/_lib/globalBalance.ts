import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { resolveCurrency, type SupportedCurrencyCode } from "./currencies";
import { convertWithStoredRates } from "./exchange";
import {
  getPersonalExpensesForUser,
  getPersonalSettlementsForUser,
} from "./personal";
import { getAllExpensesForUser } from "./spending";

/** +amount = user owes counterparty (viewer currency). */
export type CounterpartyLedger = Map<Id<"users">, number>;

async function getAllSettlementsForUser(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<Doc<"settlements">[]> {
  const byId = new Map<Id<"settlements">, Doc<"settlements">>();

  for (const settlement of await getPersonalSettlementsForUser(ctx, userId)) {
    byId.set(settlement._id, settlement);
  }

  const groups = await ctx.db.query("groups").collect();
  for (const group of groups) {
    if (!group.members.some((m) => m.userId === userId)) continue;

    const groupSettlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", group._id))
      .collect();

    for (const settlement of groupSettlements) {
      if (
        settlement.paidByUserId === userId ||
        settlement.receivedByUserId === userId
      ) {
        byId.set(settlement._id, settlement);
      }
    }
  }

  return [...byId.values()];
}

function expenseInvolvesPair(
  expense: Doc<"expenses">,
  userId: Id<"users">,
  otherId: Id<"users">
): boolean {
  const participantIds = new Set<Id<"users">>([
    expense.paidByUserId,
    ...expense.splits.map((s) => s.userId),
  ]);
  return participantIds.has(userId) && participantIds.has(otherId);
}

function settlementInvolvesPair(
  settlement: Doc<"settlements">,
  userId: Id<"users">,
  otherId: Id<"users">
): boolean {
  return (
    (settlement.paidByUserId === userId &&
      settlement.receivedByUserId === otherId) ||
    (settlement.paidByUserId === otherId &&
      settlement.receivedByUserId === userId)
  );
}

async function addLedgerDelta(
  ctx: QueryCtx,
  ledger: CounterpartyLedger,
  counterpartyId: Id<"users">,
  delta: number,
  currency: SupportedCurrencyCode,
  viewerCur: SupportedCurrencyCode
) {
  const converted =
    currency === viewerCur
      ? delta
      : await convertWithStoredRates(ctx, delta, currency, viewerCur);
  ledger.set(counterpartyId, (ledger.get(counterpartyId) ?? 0) + converted);
}

async function applyExpenseToLedger(
  ctx: QueryCtx,
  ledger: CounterpartyLedger,
  expense: Doc<"expenses">,
  userId: Id<"users">,
  viewerCur: SupportedCurrencyCode,
  options: { autoNetBalances: boolean; pairFilter?: Id<"users"> }
) {
  if (
    options.pairFilter &&
    !expenseInvolvesPair(expense, userId, options.pairFilter)
  ) {
    return;
  }

  const currency = resolveCurrency(expense.currency);

  if (expense.paidByUserId !== userId) {
    const split = expense.splits.find((s) => s.userId === userId && !s.paid);
    if (!split) return;
    await addLedgerDelta(
      ctx,
      ledger,
      expense.paidByUserId,
      split.amount,
      currency,
      viewerCur
    );
    return;
  }

  if (!options.autoNetBalances) return;

  for (const split of expense.splits) {
    if (split.userId === userId || split.paid) continue;
    await addLedgerDelta(
      ctx,
      ledger,
      split.userId,
      -split.amount,
      currency,
      viewerCur
    );
  }
}

async function applySettlementToLedger(
  ctx: QueryCtx,
  ledger: CounterpartyLedger,
  settlement: Doc<"settlements">,
  userId: Id<"users">,
  viewerCur: SupportedCurrencyCode,
  options: { autoNetBalances: boolean; pairFilter?: Id<"users"> }
) {
  if (
    options.pairFilter &&
    !settlementInvolvesPair(settlement, userId, options.pairFilter)
  ) {
    return;
  }

  if (!options.autoNetBalances && settlement.groupId !== undefined) {
    return;
  }

  const currency = resolveCurrency(settlement.currency);

  if (settlement.paidByUserId === userId) {
    await addLedgerDelta(
      ctx,
      ledger,
      settlement.receivedByUserId,
      -settlement.amount,
      currency,
      viewerCur
    );
  } else if (settlement.receivedByUserId === userId) {
    await addLedgerDelta(
      ctx,
      ledger,
      settlement.paidByUserId,
      settlement.amount,
      currency,
      viewerCur
    );
  }
}

function pruneLedger(ledger: CounterpartyLedger) {
  for (const [counterpartyId, amount] of [...ledger.entries()]) {
    if (Math.abs(amount) < 0.005) {
      ledger.delete(counterpartyId);
    } else {
      ledger.set(counterpartyId, Math.round(amount * 100) / 100);
    }
  }
}

async function getExpensesForGlobalBalance(
  ctx: QueryCtx,
  userId: Id<"users">,
  autoNetBalances: boolean
): Promise<Doc<"expenses">[]> {
  if (autoNetBalances) {
    return getAllExpensesForUser(ctx, userId);
  }
  return getPersonalExpensesForUser(ctx, userId);
}

async function getSettlementsForGlobalBalance(
  ctx: QueryCtx,
  userId: Id<"users">,
  autoNetBalances: boolean
): Promise<Doc<"settlements">[]> {
  if (autoNetBalances) {
    return getAllSettlementsForUser(ctx, userId);
  }
  return getPersonalSettlementsForUser(ctx, userId);
}

/**
 * Global net balances for Saldotiedot and person views.
 * Ledger values: + = user owes counterparty.
 */
export async function computeGlobalBalanceByCounterparty(
  ctx: QueryCtx,
  userId: Id<"users">,
  viewerCur: SupportedCurrencyCode,
  autoNetBalances: boolean
): Promise<CounterpartyLedger> {
  const ledger: CounterpartyLedger = new Map();
  const options = { autoNetBalances };

  for (const expense of await getExpensesForGlobalBalance(
    ctx,
    userId,
    autoNetBalances
  )) {
    await applyExpenseToLedger(ctx, ledger, expense, userId, viewerCur, options);
  }

  for (const settlement of await getSettlementsForGlobalBalance(
    ctx,
    userId,
    autoNetBalances
  )) {
    await applySettlementToLedger(
      ctx,
      ledger,
      settlement,
      userId,
      viewerCur,
      options
    );
  }

  pruneLedger(ledger);
  return ledger;
}

/** Signed from meId's view: + = other owes me, − = I owe other. */
export async function computeGlobalNetBetweenUsers(
  ctx: QueryCtx,
  meId: Id<"users">,
  otherId: Id<"users">,
  viewerCur: SupportedCurrencyCode,
  autoNetBalances: boolean
): Promise<number> {
  const ledger: CounterpartyLedger = new Map();
  const options = { autoNetBalances, pairFilter: otherId };

  for (const expense of await getExpensesForGlobalBalance(
    ctx,
    meId,
    autoNetBalances
  )) {
    await applyExpenseToLedger(ctx, ledger, expense, meId, viewerCur, options);
  }

  for (const settlement of await getSettlementsForGlobalBalance(
    ctx,
    meId,
    autoNetBalances
  )) {
    await applySettlementToLedger(
      ctx,
      ledger,
      settlement,
      meId,
      viewerCur,
      options
    );
  }

  const owed = ledger.get(otherId) ?? 0;
  const net = Math.round(-owed * 100) / 100;
  return Math.abs(net) < 0.005 ? 0 : net;
}
