import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { getPersonalExpensesForUser } from "./personal";

export type SpendingPeriod = "week" | "month" | "year";

export function getUserExpenseShare(
  expense: Doc<"expenses">,
  userId: Id<"users">
): number {
  const userSplit = expense.splits.find((s) => s.userId === userId);
  return userSplit?.amount ?? 0;
}

export function userParticipatesInExpense(
  expense: Doc<"expenses">,
  userId: Id<"users">
): boolean {
  return (
    expense.paidByUserId === userId ||
    expense.splits.some((s) => s.userId === userId)
  );
}

export function getSpendingPeriodBounds(
  period: SpendingPeriod,
  now = Date.now()
): { rangeStart: number; rangeEnd: number } {
  const d = new Date(now);

  if (period === "week") {
    const day = d.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - daysFromMonday);
    return { rangeStart: start.getTime(), rangeEnd: now };
  }

  if (period === "month") {
    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    return { rangeStart: start.getTime(), rangeEnd: now };
  }

  const start = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
  return { rangeStart: start.getTime(), rangeEnd: now };
}

/** All expenses the user participates in (personal + groups). */
export async function getAllExpensesForUser(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<Doc<"expenses">[]> {
  const byId = new Map<Id<"expenses">, Doc<"expenses">>();

  for (const expense of await getPersonalExpensesForUser(ctx, userId)) {
    byId.set(expense._id, expense);
  }

  const allGroups = await ctx.db.query("groups").collect();
  const myGroups = allGroups.filter((g) =>
    g.members.some((m) => m.userId === userId)
  );

  for (const group of myGroups) {
    const groupExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", group._id))
      .collect();

    for (const expense of groupExpenses) {
      if (userParticipatesInExpense(expense, userId)) {
        byId.set(expense._id, expense);
      }
    }
  }

  return [...byId.values()];
}

const WEEKDAY_LABELS = ["ma", "ti", "ke", "to", "pe", "la", "su"] as const;

const MONTH_LABELS = [
  "tammi",
  "helmi",
  "maalis",
  "huhti",
  "touko",
  "kesä",
  "heinä",
  "elo",
  "syys",
  "loka",
  "marras",
  "joulu",
] as const;

export function buildTimeBuckets(
  period: SpendingPeriod,
  rangeStart: number,
  rangeEnd: number
): { label: string; amount: number; sortKey: number }[] {
  const end = new Date(rangeEnd);
  const start = new Date(rangeStart);

  if (period === "week") {
    return WEEKDAY_LABELS.map((label, index) => ({
      label,
      amount: 0,
      sortKey: index,
    }));
  }

  if (period === "month") {
    const year = end.getFullYear();
    const month = end.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const buckets: { label: string; amount: number; sortKey: number }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      buckets.push({
        label: String(day),
        amount: 0,
        sortKey: day,
      });
    }
    return buckets;
  }

  const year = end.getFullYear();
  return MONTH_LABELS.map((label, index) => ({
    label,
    amount: 0,
    sortKey: index,
  }));
}

export function timeBucketKey(
  period: SpendingPeriod,
  expenseDate: number,
  rangeStart: number
): number {
  const date = new Date(expenseDate);

  if (period === "week") {
    const weekStart = new Date(rangeStart);
    weekStart.setHours(0, 0, 0, 0);
    const diffMs = date.getTime() - weekStart.getTime();
    const dayIndex = Math.floor(diffMs / 86_400_000);
    return Math.min(Math.max(dayIndex, 0), 6);
  }

  if (period === "month") {
    return date.getDate();
  }

  return date.getMonth();
}

export function applyExpenseToTimeBuckets(
  buckets: { label: string; amount: number; sortKey: number }[],
  period: SpendingPeriod,
  expenseDate: number,
  share: number,
  rangeStart: number
): void {
  const key = timeBucketKey(period, expenseDate, rangeStart);
  const bucket = buckets.find((b) => b.sortKey === key);
  if (bucket) {
    bucket.amount += share;
  }
}
