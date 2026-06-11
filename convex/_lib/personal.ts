import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/** 1-to-1 expenses where the user paid or appears in splits (indexed, no full table scan). */
export async function getPersonalExpensesForUser(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<Doc<"expenses">[]> {
  const expensesYouPaid = await ctx.db
    .query("expenses")
    .withIndex("by_user_and_group", (q) =>
      q.eq("paidByUserId", userId).eq("groupId", undefined)
    )
    .collect();

  const expensesNotPaidByYou = (
    await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", undefined))
      .collect()
  ).filter(
    (e) =>
      !e.workspaceId &&
      e.paidByUserId !== userId &&
      e.splits.some((s) => s.userId === userId)
  );

  const byId = new Map<Id<"expenses">, Doc<"expenses">>();
  for (const expense of [...expensesYouPaid, ...expensesNotPaidByYou]) {
    if (expense.workspaceId) continue;
    byId.set(expense._id, expense);
  }
  return [...byId.values()];
}

/** 1-to-1 settlements where the user paid or received (indexed). */
export async function getPersonalSettlementsForUser(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<Doc<"settlements">[]> {
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

  const byId = new Map<Id<"settlements">, Doc<"settlements">>();
  for (const settlement of [...asPayer, ...asReceiver]) {
    byId.set(settlement._id, settlement);
  }
  return [...byId.values()];
}
