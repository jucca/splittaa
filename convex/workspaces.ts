import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./_lib/auth";
import {
  assertWorkspaceMember,
  getWorkspaceExpenses,
  getWorkspacesForUser,
  isWorkspaceAdmin,
} from "./_lib/workspaces";
import { listWorkspaceBalancesForUser } from "./_lib/balances";
import { balanceCurrency } from "./_lib/exchange";
import {
  categoryTotalsToArray,
  emptyCategoryTotals,
  normalizeExpenseCategoryId,
} from "./_lib/categories";
import type { ExpenseCategoryId } from "./_lib/categories";
import {
  convertToViewer,
  signedBalanceForViewer,
  viewerCurrency,
} from "./_lib/moneyDisplay";
import { resolveCurrency } from "./_lib/currencies";
import { computeGoalProgress } from "../lib/workspace-goals";

const goalInputValidator = v.object({
  type: v.union(v.literal("budget_cap"), v.literal("savings_target")),
  label: v.string(),
  targetAmount: v.number(),
  currency: v.optional(v.string()),
});

export const create = mutation({
  args: {
    name: v.string(),
    themeId: v.string(),
    goals: v.array(goalInputValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (!args.name.trim()) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Anna työpöydälle nimi",
      });
    }
    if (args.goals.length === 0) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Lisää vähintään yksi tavoite",
      });
    }

    const now = Date.now();
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name.trim(),
      themeId: args.themeId,
      createdBy: user._id,
      members: [
        {
          userId: user._id,
          role: "admin",
          joinedAt: now,
        },
      ],
    });

    const defaultCurrency = resolveCurrency(user.preferredCurrency);
    for (let i = 0; i < args.goals.length; i++) {
      const goal = args.goals[i]!;
      if (goal.targetAmount <= 0) {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: "Tavoitteen summan on oltava positiivinen",
        });
      }
      await ctx.db.insert("workspaceGoals", {
        workspaceId,
        type: goal.type,
        label: goal.label.trim(),
        targetAmount: goal.targetAmount,
        currency: resolveCurrency(goal.currency ?? defaultCurrency),
        sortOrder: i,
      });
    }

    return workspaceId;
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const workspaces = await getWorkspacesForUser(ctx, user._id);

    const results = [];
    for (const workspace of workspaces) {
      const goals = await ctx.db
        .query("workspaceGoals")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
        .collect();

      const expenses = await getWorkspaceExpenses(ctx, workspace._id);
      const spentTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

      const primaryGoal = goals.sort((a, b) => a.sortOrder - b.sortOrder)[0];
      let goalSummary: { label: string; percent: number } | null = null;
      if (primaryGoal) {
        let depositedTotal = 0;
        if (primaryGoal.type === "savings_target") {
          const deposits = await ctx.db
            .query("workspaceDeposits")
            .withIndex("by_goal", (q) => q.eq("goalId", primaryGoal._id))
            .collect();
          depositedTotal = deposits.reduce((sum, d) => sum + d.amount, 0);
        }
        const progress = computeGoalProgress({
          type: primaryGoal.type,
          targetAmount: primaryGoal.targetAmount,
          spentTotal,
          depositedTotal,
        });
        goalSummary = { label: primaryGoal.label, percent: progress.percent };
      }

      results.push({
        id: workspace._id,
        name: workspace.name,
        themeId: workspace.themeId,
        memberCount: workspace.members.length,
        goalSummary,
      });
    }

    return results;
  },
});

export const get = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const user = await requireAuth(ctx);
    const workspace = await assertWorkspaceMember(ctx, workspaceId, user._id);
    return {
      id: workspace._id,
      name: workspace.name,
      themeId: workspace.themeId,
      memberCount: workspace.members.length,
      isAdmin: isWorkspaceAdmin(workspace, user._id),
    };
  },
});

export const getMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const user = await requireAuth(ctx);
    const workspace = await assertWorkspaceMember(ctx, workspaceId, user._id);

    const members = [];
    for (const member of workspace.members) {
      const profile = await ctx.db.get(member.userId);
      members.push({
        userId: member.userId,
        name: profile?.name ?? "Tuntematon",
        imageUrl: profile?.imageUrl,
        role: member.role,
        isYou: member.userId === user._id,
      });
    }
    return members;
  },
});

export const getGoals = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const user = await requireAuth(ctx);
    await assertWorkspaceMember(ctx, workspaceId, user._id);

    const goals = await ctx.db
      .query("workspaceGoals")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    const expenses = await getWorkspaceExpenses(ctx, workspaceId);
    const spentTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

    const sorted = goals.sort((a, b) => a.sortOrder - b.sortOrder);
    const results = [];
    for (const goal of sorted) {
      let depositedTotal = 0;
      if (goal.type === "savings_target") {
        const deposits = await ctx.db
          .query("workspaceDeposits")
          .withIndex("by_goal", (q) => q.eq("goalId", goal._id))
          .collect();
        depositedTotal = deposits.reduce((sum, d) => sum + d.amount, 0);
      }
      const progress = computeGoalProgress({
        type: goal.type,
        targetAmount: goal.targetAmount,
        spentTotal,
        depositedTotal,
      });
      results.push({
        id: goal._id,
        type: goal.type,
        label: goal.label,
        targetAmount: goal.targetAmount,
        currency: goal.currency,
        current: progress.current,
        percent: progress.percent,
        remaining: progress.remaining,
      });
    }
    return results;
  },
});

export const getBalances = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const user = await requireAuth(ctx);
    await assertWorkspaceMember(ctx, workspaceId, user._id);
    const viewerCur = viewerCurrency(user);

    const rows = await listWorkspaceBalancesForUser(
      ctx,
      workspaceId,
      user._id
    );

    const netByCounterparty = new Map<Id<"users">, number>();
    for (const row of rows) {
      const signed = await signedBalanceForViewer(
        ctx,
        user._id,
        viewerCur,
        row
      );
      const counterpartyId =
        row.userId === user._id ? row.counterpartyUserId : row.userId;
      netByCounterparty.set(
        counterpartyId,
        (netByCounterparty.get(counterpartyId) ?? 0) + signed
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

export const getTotalSpent = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const user = await requireAuth(ctx);
    await assertWorkspaceMember(ctx, workspaceId, user._id);
    const viewerCur = viewerCurrency(user);

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).getTime();

    const expenses = await getWorkspaceExpenses(ctx, workspaceId);
    let totalSpent = 0;

    for (const expense of expenses) {
      if (expense.date < startOfYear) continue;
      totalSpent += await convertToViewer(
        ctx,
        viewerCur,
        expense.amount,
        balanceCurrency(expense)
      );
    }

    return { total: totalSpent, currency: viewerCur };
  },
});

export const getMonthlySpending = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const user = await requireAuth(ctx);
    await assertWorkspaceMember(ctx, workspaceId, user._id);
    const viewerCur = viewerCurrency(user);

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).getTime();

    const monthlyTotals: Record<number, number> = {};
    const monthlyCategoryTotals = new Map<
      number,
      Map<ExpenseCategoryId, number>
    >();
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(currentYear, i, 1).getTime();
      monthlyTotals[monthStart] = 0;
      monthlyCategoryTotals.set(monthStart, emptyCategoryTotals());
    }

    const expenses = await getWorkspaceExpenses(ctx, workspaceId);
    for (const expense of expenses) {
      if (expense.date < startOfYear) continue;

      const converted = await convertToViewer(
        ctx,
        viewerCur,
        expense.amount,
        balanceCurrency(expense)
      );
      const monthStart = new Date(
        new Date(expense.date).getFullYear(),
        new Date(expense.date).getMonth(),
        1
      ).getTime();
      monthlyTotals[monthStart] = (monthlyTotals[monthStart] || 0) + converted;

      const categoryId = normalizeExpenseCategoryId(expense.category);
      const categoryTotals =
        monthlyCategoryTotals.get(monthStart) ?? emptyCategoryTotals();
      categoryTotals.set(
        categoryId,
        (categoryTotals.get(categoryId) ?? 0) + converted
      );
      monthlyCategoryTotals.set(monthStart, categoryTotals);
    }

    const result = Object.entries(monthlyTotals).map(([month, total]) => ({
      month: parseInt(month),
      total,
      byCategory: categoryTotalsToArray(
        monthlyCategoryTotals.get(parseInt(month)) ?? emptyCategoryTotals()
      ),
    }));
    result.sort((a, b) => a.month - b.month);

    return { months: result, currency: viewerCur };
  },
});

export const recordDeposit = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    goalId: v.id("workspaceGoals"),
    amount: v.number(),
    note: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    await assertWorkspaceMember(ctx, args.workspaceId, user._id);

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.workspaceId !== args.workspaceId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Tavoitetta ei löytynyt",
      });
    }
    if (goal.type !== "savings_target") {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Talletuksia voi kirjata vain säästötavoitteisiin",
      });
    }
    if (args.amount <= 0) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Summan on oltava positiivinen",
      });
    }

    await ctx.db.insert("workspaceDeposits", {
      workspaceId: args.workspaceId,
      goalId: args.goalId,
      amount: args.amount,
      currency: goal.currency,
      note: args.note,
      date: args.date ?? Date.now(),
      createdBy: user._id,
    });
  },
});
