// Must stay in sync with lib/expense-categories.ts CATEGORY_IDS order.
export const EXPENSE_CATEGORY_IDS = [
  "foodDrink", "coffee", "groceries", "shopping", "travel", "transportation",
  "housing", "entertainment", "tickets", "utilities", "water", "education",
  "health", "personal", "gifts", "technology", "bills", "baby", "music",
  "books", "other", "general",
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORY_IDS)[number];

const CATEGORY_ID_SET = new Set<string>(EXPENSE_CATEGORY_IDS);

export function normalizeExpenseCategoryId(
  raw: string | undefined
): ExpenseCategoryId {
  if (!raw || raw === "Other") return "other";
  if (CATEGORY_ID_SET.has(raw)) return raw as ExpenseCategoryId;
  return "other";
}

export function emptyCategoryTotals(): Map<ExpenseCategoryId, number> {
  return new Map(EXPENSE_CATEGORY_IDS.map((id) => [id, 0] as const));
}

export function categoryTotalsToArray(
  totals: Map<ExpenseCategoryId, number>
): { categoryId: string; amount: number }[] {
  return EXPENSE_CATEGORY_IDS.map((categoryId) => ({
    categoryId,
    amount: totals.get(categoryId) ?? 0,
  }));
}
