import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./_lib/auth";
import { balanceCurrency } from "./_lib/exchange";
import {
  convertToViewer,
  signedBalanceForViewer,
  viewerCurrency,
} from "./_lib/moneyDisplay";
import {
  getAllExpensesForUser,
  getUserExpenseShare,
  userParticipatesInExpense,
} from "./_lib/spending";

// Get user balances
export const getUserBalances = query({
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const viewerCur = viewerCurrency(user);

    const rows = await ctx.db
      .query("balances")
      .withIndex("by_scope", (q) =>
        q.eq("scopeType", "personal").eq("scopeGroupId", undefined)
      )
      .collect();

    const netByCounterparty = new Map<Id<"users">, number>();

    for (const row of rows) {
      if (row.userId !== user._id && row.counterpartyUserId !== user._id) {
        continue;
      }
      const counterparty =
        row.userId === user._id ? row.counterpartyUserId : row.userId;
      const signed = await signedBalanceForViewer(
        ctx,
        user._id,
        viewerCur,
        row
      );
      netByCounterparty.set(
        counterparty,
        (netByCounterparty.get(counterparty) ?? 0) + signed
      );
    }

    let youOwe = 0;
    let youAreOwed = 0;
    const youOweList = [];
    const youAreOwedByList = [];

    for (const [uid, net] of netByCounterparty) {
      if (Math.abs(net) < 0.005) continue;
      const counterpart = await ctx.db.get(uid);
      const base = {
        userId: uid,
        name: counterpart?.name ?? "Unknown",
        imageUrl: counterpart?.imageUrl,
        amount: Math.abs(net),
      };
      if (net > 0) {
        youAreOwed += net;
        youAreOwedByList.push(base);
      } else {
        youOwe += Math.abs(net);
        youOweList.push(base);
      }
    }

    youOweList.sort((a, b) => b.amount - a.amount);
    youAreOwedByList.sort((a, b) => b.amount - a.amount);

    return {
      youOwe,
      youAreOwed,
      totalBalance: youAreOwed - youOwe,
      currency: viewerCur,
      oweDetails: { youOwe: youOweList, youAreOwedBy: youAreOwedByList },
    };
  },
});

// Get total spent in the current year
export const getTotalSpent = query({
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const viewerCur = viewerCurrency(user);

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).getTime();

    const expenses = await getAllExpensesForUser(ctx, user._id);
    let totalSpent = 0;

    for (const expense of expenses) {
      if (expense.date < startOfYear) continue;
      if (!userParticipatesInExpense(expense, user._id)) continue;
      const share = getUserExpenseShare(expense, user._id);
      if (share <= 0) continue;
      totalSpent += await convertToViewer(
        ctx,
        viewerCur,
        share,
        balanceCurrency(expense)
      );
    }

    return { total: totalSpent, currency: viewerCur };
  },
});

// Get monthly spending
export const getMonthlySpending = query({
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const viewerCur = viewerCurrency(user);

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).getTime();

    const monthlyTotals: Record<number, number> = {};
    for (let i = 0; i < 12; i++) {
      monthlyTotals[new Date(currentYear, i, 1).getTime()] = 0;
    }

    const expenses = await getAllExpensesForUser(ctx, user._id);
    for (const expense of expenses) {
      if (expense.date < startOfYear) continue;
      if (!userParticipatesInExpense(expense, user._id)) continue;
      const share = getUserExpenseShare(expense, user._id);
      if (share <= 0) continue;

      const converted = await convertToViewer(
        ctx,
        viewerCur,
        share,
        balanceCurrency(expense)
      );
      const monthStart = new Date(
        new Date(expense.date).getFullYear(),
        new Date(expense.date).getMonth(),
        1
      ).getTime();
      monthlyTotals[monthStart] = (monthlyTotals[monthStart] || 0) + converted;
    }

    const result = Object.entries(monthlyTotals).map(([month, total]) => ({
      month: parseInt(month),
      total,
    }));
    result.sort((a, b) => a.month - b.month);

    return { months: result, currency: viewerCur };
  },
});

// Get groups for the current user
export const getUserGroups = query({
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    // Get all groups
    const allGroups = await ctx.db.query("groups").collect();

    // Filter for groups where the user is a member
    const groups = allGroups.filter((group) =>
      group.members.some((member) => member.userId === user._id)
    );

    const viewerCur = viewerCurrency(user);

    const enhancedGroups = await Promise.all(
      groups.map(async (group) => {
        const snapshotRows = await ctx.db
          .query("balances")
          .withIndex("by_scope", (q) =>
            q.eq("scopeType", "group").eq("scopeGroupId", group._id)
          )
          .collect();

        let balance = 0;
        for (const row of snapshotRows) {
          if (row.userId !== user._id && row.counterpartyUserId !== user._id) {
            continue;
          }
          balance += await signedBalanceForViewer(
            ctx,
            user._id,
            viewerCur,
            row
          );
        }

        return {
          ...group,
          id: group._id,
          balance,
        };
      })
    );

    return enhancedGroups;
  },
});