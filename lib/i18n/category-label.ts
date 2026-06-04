import type { useTranslations } from "next-intl";
import type { ExpenseCategoryId } from "@/lib/expense-categories";

type CategoryTranslator = ReturnType<typeof useTranslations<"categories">>;

const CATEGORY_IDS: ExpenseCategoryId[] = [
  "foodDrink",
  "coffee",
  "groceries",
  "shopping",
  "travel",
  "transportation",
  "housing",
  "entertainment",
  "tickets",
  "utilities",
  "water",
  "education",
  "health",
  "personal",
  "gifts",
  "technology",
  "bills",
  "baby",
  "music",
  "books",
  "other",
  "general",
];

export function getCategoryLabel(
  t: CategoryTranslator,
  categoryId: string
): string {
  const id = categoryId as ExpenseCategoryId;
  if (CATEGORY_IDS.includes(id)) {
    return t(id);
  }
  return t("other");
}
