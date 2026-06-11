import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./_lib/auth";
import { assertGroupMember } from "./_lib/authorize";
import {
  assertWorkspaceMember,
  assertWorkspaceMembers,
} from "./_lib/workspaces";
import { validateSplits } from "./_lib/money";
import { isSupportedCurrency, resolveCurrency } from "./_lib/currencies";
import { applyExpenseToBalances } from "./_lib/balances";
import { normalizeBalanceSettings } from "./_lib/balanceSettings";
import { computeGlobalNetBetweenUsers } from "./_lib/globalBalance";
import { viewerCurrency } from "./_lib/moneyDisplay";

// Create a new expense
export const createExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.number(), // timestamp
    paidByUserId: v.id("users"),
    splitType: v.string(), // "equal", "percentage", "exact"
    splits: v.array(
      v.object({
        userId: v.id("users"),
        amount: v.number(),
        paid: v.boolean(),
      })
    ),
    groupId: v.optional(v.id("groups")),
    workspaceId: v.optional(v.id("workspaces")),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Use centralized getCurrentUser function
    const user = await requireAuth(ctx);

    if (args.groupId && args.workspaceId) {
      throw new Error("Kulu ei voi kuulua sekä ryhmälle että työpöydälle");
    }

    if (args.workspaceId) {
      await assertWorkspaceMember(ctx, args.workspaceId, user._id);
      const participantIds = [
        ...new Set([...args.splits.map((s) => s.userId), args.paidByUserId]),
      ];
      await assertWorkspaceMembers(ctx, args.workspaceId, participantIds);
    }

    if (args.groupId) {
      await assertGroupMember(ctx, args.groupId, user._id);
    }

    const splitCheck = validateSplits(args.amount, args.splits);
    if (!splitCheck.ok) {
      throw new Error(
        "Jaettujen summien on oltava yhtä suuri kuin kulun kokonaissumma"
      );
    }

    if (args.currency !== undefined && !isSupportedCurrency(args.currency)) {
      throw new Error("Virheellinen valuutta");
    }
    const currency = resolveCurrency(args.currency ?? user.preferredCurrency);

    // Create the expense
    const expenseId = await ctx.db.insert("expenses", {
      description: args.description,
      amount: args.amount,
      currency,
      category: args.category || "Other",
      date: args.date,
      paidByUserId: args.paidByUserId,
      splitType: args.splitType,
      splits: args.splits,
      groupId: args.groupId,
      workspaceId: args.workspaceId,
      createdBy: user._id,
    });

    await applyExpenseToBalances(
      ctx,
      {
        paidByUserId: args.paidByUserId,
        groupId: args.groupId,
        workspaceId: args.workspaceId,
        currency,
        splits: args.splits,
      },
      1
    );

    return expenseId;
  },
});

// ----------- Expenses Page -----------

// Get expenses between current user and a specific person
export const getExpensesBetweenUsers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await requireAuth(ctx);
    if (me._id === userId) throw new Error("Et voi hakea tietoja itsestäsi");

    /* ───── 1. One-on-one expenses where either user is the payer ───── */
    // Use the compound index (`paidByUserId`,`groupId`) with groupId = undefined
    const myPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", me._id).eq("groupId", undefined)
      )
      .collect();

    const theirPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", userId).eq("groupId", undefined)
      )
      .collect();

    // Merge → candidate set is now just the rows either of us paid for
    const candidateExpenses = [...myPaid, ...theirPaid];

    /* ───── 2. Keep only rows where BOTH are involved (payer or split) ─ */
    const expenses = candidateExpenses.filter((e) => {
      // me is always involved (I’m the payer OR in splits – verified below)
      const meInSplits = e.splits.some((s) => s.userId === me._id);
      const themInSplits = e.splits.some((s) => s.userId === userId);

      const meInvolved = e.paidByUserId === me._id || meInSplits;
      const themInvolved = e.paidByUserId === userId || themInSplits;

      return meInvolved && themInvolved;
    });

    expenses.sort((a, b) => b.date - a.date);

    /* ───── 3. Settlements between the two of us (groupId = undefined) ─ */
    const settlements = await ctx.db
      .query("settlements")
      .filter((q) =>
        q.and(
          q.eq(q.field("groupId"), undefined),
          q.or(
            q.and(
              q.eq(q.field("paidByUserId"), me._id),
              q.eq(q.field("receivedByUserId"), userId)
            ),
            q.and(
              q.eq(q.field("paidByUserId"), userId),
              q.eq(q.field("receivedByUserId"), me._id)
            )
          )
        )
      )
      .collect();

    settlements.sort((a, b) => b.date - a.date);

    /* ───── 4. Compute running balance (viewer's preferred currency) ─ */
    const viewerCur = viewerCurrency(me);
    const { autoNetBalances } = normalizeBalanceSettings(
      me.balanceSettings ?? undefined
    );
    const balance = await computeGlobalNetBetweenUsers(
      ctx,
      me._id,
      userId,
      viewerCur,
      autoNetBalances
    );

    /* ───── 5. Return payload ───────────────────────────────────────── */
    const other = await ctx.db.get(userId);
    if (!other) throw new Error("Käyttäjää ei löytynyt");

    return {
      expenses,
      settlements,
      otherUser: {
        id: other._id,
        name: other.name,
        email: other.email,
        imageUrl: other.imageUrl,
      },
      balance,
    };
  },
});

// Delete an expense
export const deleteExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    // Get the current user
    const user = await requireAuth(ctx);

    // Get the expense
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new Error("Kulua ei löytynyt");
    }

    // Check if user is authorized to delete this expense
    // Only the creator of the expense or the payer can delete it
    if (expense.createdBy !== user._id && expense.paidByUserId !== user._id) {
      throw new Error("Sinulla ei ole oikeutta poistaa tätä kulua");
    }

    // Find settlements linked to this expense using indexes instead of a full table scan
    let candidateSettlements;
    if (expense.groupId) {
      candidateSettlements = await ctx.db
        .query("settlements")
        .withIndex("by_group", (q) => q.eq("groupId", expense.groupId))
        .collect();
    } else {
      const participantIds = [
        ...new Set([
          expense.paidByUserId,
          ...expense.splits.map((split) => split.userId),
        ]),
      ];
      const settlementMap = new Map();
      for (const userId of participantIds) {
        const asPayer = await ctx.db
          .query("settlements")
          .withIndex("by_user_and_group", (q) =>
            q.eq("paidByUserId", userId).eq("groupId", undefined)
          )
          .collect();
        const asReceiver = await ctx.db
          .query("settlements")
          .withIndex("by_receiver_and_group", (q) =>
            q.eq("receivedByUserId", userId).eq("groupId", undefined)
          )
          .collect();
        for (const settlement of [...asPayer, ...asReceiver]) {
          settlementMap.set(settlement._id, settlement);
        }
      }
      candidateSettlements = [...settlementMap.values()];
    }

    const relatedSettlements = candidateSettlements.filter(
      (settlement) =>
        settlement.relatedExpenseIds !== undefined &&
        settlement.relatedExpenseIds.includes(args.expenseId)
    );

    for (const settlement of relatedSettlements) {
      // Remove this expense ID from the relatedExpenseIds array
      const updatedRelatedExpenseIds = settlement.relatedExpenseIds.filter(
        (id: Id<"expenses">) => id !== args.expenseId
      );

      if (updatedRelatedExpenseIds.length === 0) {
        // If this was the only related expense, delete the settlement
        await ctx.db.delete(settlement._id);
      } else {
        // Otherwise update the settlement to remove this expense ID
        await ctx.db.patch(settlement._id, {
          relatedExpenseIds: updatedRelatedExpenseIds,
        });
      }
    }

    await applyExpenseToBalances(
      ctx,
      {
        paidByUserId: expense.paidByUserId,
        groupId: expense.groupId,
        currency: resolveCurrency(expense.currency),
        splits: expense.splits,
      },
      -1
    );

    // Delete the expense
    await ctx.db.delete(args.expenseId);

    return { success: true };
  },
});
