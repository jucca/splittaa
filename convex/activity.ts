import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAuth } from "./_lib/auth";
import {
  getPersonalExpensesForUser,
  getPersonalSettlementsForUser,
} from "./_lib/personal";
import {
  applyExpenseToTimeBuckets,
  buildTimeBuckets,
  getAllExpensesForUser,
  getSpendingPeriodBounds,
  getUserExpenseShare,
  userParticipatesInExpense,
  type SpendingPeriod,
} from "./_lib/spending";
import { balanceCurrency } from "./_lib/exchange";
import { convertToViewer, viewerCurrency } from "./_lib/moneyDisplay";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export type ActivityEntry = {
  id: string;
  kind: "expense" | "settlement";
  date: number;
  amount: number;
  currency: string;
  title: string;
  subtitle: string;
  contextType: "group" | "personal";
  href: string;
};

async function userName(
  ctx: { db: QueryCtx["db"] },
  userId: Id<"users">,
  cache: Map<Id<"users">, string>
): Promise<string> {
  const cached = cache.get(userId);
  if (cached) return cached;
  const user = await ctx.db.get(userId);
  const name = user?.name ?? "Tuntematon";
  cache.set(userId, name);
  return name;
}

function expenseEntryForUser(
  expense: Doc<"expenses">,
  userId: Id<"users">,
  context: {
    contextType: "group" | "personal";
    contextName: string;
    href: string;
    payerName: string;
    amount: number;
    currency: string;
  }
): ActivityEntry | null {
  const mySplit = expense.splits.find((s) => s.userId === userId);
  const isPayer = expense.paidByUserId === userId;

  if (!isPayer && !mySplit) {
    return null;
  }

  if (isPayer) {
    return {
      id: `expense:${expense._id}`,
      kind: "expense",
      date: expense.date,
      amount: context.amount,
      currency: context.currency,
      title: expense.description,
      subtitle:
        context.contextType === "group"
          ? `Maksoit · ${context.contextName}`
          : `Maksoit · ${context.contextName}`,
      contextType: context.contextType,
      href: context.href,
    };
  }

  return {
    id: `expense:${expense._id}`,
    kind: "expense",
    date: expense.date,
    amount: context.amount,
    currency: context.currency,
    title: expense.description,
    subtitle: `Osuutesi · ${context.payerName} maksoi · ${context.contextName}`,
    contextType: context.contextType,
    href: context.href,
  };
}

function settlementEntryForUser(
  settlement: Doc<"settlements">,
  userId: Id<"users">,
  context: {
    contextType: "group" | "personal";
    contextName: string;
    href: string;
    payerName: string;
    receiverName: string;
    amount: number;
    currency: string;
  }
): ActivityEntry {
  const isPayer = settlement.paidByUserId === userId;

  if (isPayer) {
    return {
      id: `settlement:${settlement._id}`,
      kind: "settlement",
      date: settlement.date,
      amount: context.amount,
      currency: context.currency,
      title: "Tilitys",
      subtitle: `Maksoit ${context.receiverName}lle · ${context.contextName}`,
      contextType: context.contextType,
      href: context.href,
    };
  }

  return {
    id: `settlement:${settlement._id}`,
    kind: "settlement",
    date: settlement.date,
    amount: context.amount,
    currency: context.currency,
    title: "Tilitys vastaanotettu",
    subtitle: `Sait ${context.payerName}lta · ${context.contextName}`,
    contextType: context.contextType,
    href: context.href,
  };
}

export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const viewerCur = viewerCurrency(user);
    const limit = Math.min(
      Math.max(1, args.limit ?? DEFAULT_LIMIT),
      MAX_LIMIT
    );
    const nameCache = new Map<Id<"users">, string>();
    const entries: ActivityEntry[] = [];

    const personalExpenses = await getPersonalExpensesForUser(ctx, user._id);
    for (const expense of personalExpenses) {
      const otherUserId =
        expense.paidByUserId === user._id
          ? expense.splits.find((s) => s.userId !== user._id)?.userId
          : expense.paidByUserId;

      const contextName = otherUserId
        ? await userName(ctx, otherUserId, nameCache)
        : "Henkilökohtainen";
      const payerName = await userName(ctx, expense.paidByUserId, nameCache);
      const href = otherUserId ? `/person/${otherUserId}` : "/contacts";

      const rawAmount =
        expense.paidByUserId === user._id
          ? expense.amount
          : (expense.splits.find((s) => s.userId === user._id)?.amount ?? 0);
      const converted = await convertToViewer(
        ctx,
        viewerCur,
        rawAmount,
        balanceCurrency(expense)
      );
      const entry = expenseEntryForUser(expense, user._id, {
        contextType: "personal",
        contextName,
        href,
        payerName,
        amount: converted,
        currency: viewerCur,
      });
      if (entry) entries.push(entry);
    }

    const personalSettlements = await getPersonalSettlementsForUser(
      ctx,
      user._id
    );
    for (const settlement of personalSettlements) {
      const counterpartyId =
        settlement.paidByUserId === user._id
          ? settlement.receivedByUserId
          : settlement.paidByUserId;
      const contextName = await userName(ctx, counterpartyId, nameCache);
      const payerName = await userName(ctx, settlement.paidByUserId, nameCache);
      const receiverName = await userName(
        ctx,
        settlement.receivedByUserId,
        nameCache
      );

      const converted = await convertToViewer(
        ctx,
        viewerCur,
        settlement.amount,
        balanceCurrency(settlement)
      );
      entries.push(
        settlementEntryForUser(settlement, user._id, {
          contextType: "personal",
          contextName,
          href: `/person/${counterpartyId}`,
          payerName,
          receiverName,
          amount: converted,
          currency: viewerCur,
        })
      );
    }

    const allGroups = await ctx.db.query("groups").collect();
    const myGroups = allGroups.filter((g) =>
      g.members.some((m) => m.userId === user._id)
    );

    for (const group of myGroups) {
      const groupHref = `/groups/${group._id}`;
      const groupName = group.name;

      const groupExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .collect();

      for (const expense of groupExpenses) {
        const payerName = await userName(ctx, expense.paidByUserId, nameCache);
        const rawAmount =
          expense.paidByUserId === user._id
            ? expense.amount
            : (expense.splits.find((s) => s.userId === user._id)?.amount ?? 0);
        const converted = await convertToViewer(
          ctx,
          viewerCur,
          rawAmount,
          balanceCurrency(expense)
        );
        const entry = expenseEntryForUser(expense, user._id, {
          contextType: "group",
          contextName: groupName,
          href: groupHref,
          payerName,
          amount: converted,
          currency: viewerCur,
        });
        if (entry) entries.push(entry);
      }

      const groupSettlements = await ctx.db
        .query("settlements")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .collect();

      for (const settlement of groupSettlements) {
        if (
          settlement.paidByUserId !== user._id &&
          settlement.receivedByUserId !== user._id
        ) {
          continue;
        }
        const payerName = await userName(ctx, settlement.paidByUserId, nameCache);
        const receiverName = await userName(
          ctx,
          settlement.receivedByUserId,
          nameCache
        );
        const converted = await convertToViewer(
          ctx,
          viewerCur,
          settlement.amount,
          balanceCurrency(settlement)
        );
        entries.push(
          settlementEntryForUser(settlement, user._id, {
            contextType: "group",
            contextName: groupName,
            href: groupHref,
            payerName,
            receiverName,
            amount: converted,
            currency: viewerCur,
          })
        );
      }
    }

    entries.sort((a, b) => b.date - a.date);

    const seen = new Set<string>();
    const deduped: ActivityEntry[] = [];
    for (const entry of entries) {
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      deduped.push(entry);
      if (deduped.length >= limit) break;
    }

    return deduped;
  },
});

export const getSpendingSummary = query({
  args: {
    period: v.union(
      v.literal("week"),
      v.literal("month"),
      v.literal("year")
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const viewerCur = viewerCurrency(user);
    const period = args.period as SpendingPeriod;
    const { rangeStart, rangeEnd } = getSpendingPeriodBounds(period);

    const allExpenses = await getAllExpensesForUser(ctx, user._id);
    const inRange = allExpenses.filter(
      (e) =>
        e.date >= rangeStart &&
        e.date <= rangeEnd &&
        userParticipatesInExpense(e, user._id)
    );

    const byTime = buildTimeBuckets(period, rangeStart, rangeEnd);
    const categoryTotals = new Map<string, number>();

    let totalAmount = 0;

    for (const expense of inRange) {
      const share = getUserExpenseShare(expense, user._id);
      if (share <= 0) continue;

      const converted = await convertToViewer(
        ctx,
        viewerCur,
        share,
        balanceCurrency(expense)
      );

      totalAmount += converted;
      applyExpenseToTimeBuckets(
        byTime,
        period,
        expense.date,
        converted,
        rangeStart
      );

      const categoryId = expense.category || "other";
      categoryTotals.set(
        categoryId,
        (categoryTotals.get(categoryId) ?? 0) + converted
      );
    }

    const byCategory = [...categoryTotals.entries()]
      .map(([categoryId, amount]) => ({
        categoryId,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      period,
      rangeStart,
      rangeEnd,
      totalAmount,
      currency: viewerCur,
      expenseCount: inRange.filter(
        (e) => getUserExpenseShare(e, user._id) > 0
      ).length,
      byTime,
      byCategory,
    };
  },
});
