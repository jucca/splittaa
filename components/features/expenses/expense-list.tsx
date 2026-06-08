"use client";

import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { format as formatDate } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCategoryColor, getCategoryIcon } from "@/lib/expense-categories";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMoney } from "@/components/providers/money-format-provider";
import type { Id } from "@/convex/_generated/dataModel";
import { useLocale, useTranslations } from "next-intl";
import { useDateFnsLocale } from "@/lib/i18n/use-date-fns-locale";
import { getCategoryLabel } from "@/lib/i18n/category-label";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";

type ExpenseSplitRow = {
  userId: Id<"users">;
  amount: number;
};

export type ExpenseListItem = {
  _id: Id<"expenses">;
  description: string;
  amount: number;
  currency?: string;
  category?: string;
  date: number;
  paidByUserId: Id<"users">;
  createdBy: Id<"users">;
  splits?: ExpenseSplitRow[];
};

export function ExpenseList({
  expenses,
  showOtherPerson = true,
  isGroupExpense = false,
  otherPersonId = null,
  userLookupMap = {},
}: {
  expenses: ExpenseListItem[] | null | undefined;
  showOtherPerson?: boolean;
  isGroupExpense?: boolean;
  otherPersonId?: Id<"users"> | null;
  userLookupMap?: Record<string, { name?: string; imageUrl?: string | null }>;
}) {
  const t = useTranslations("expenses.list");
  const { format: formatAmount } = useMoney();
  const tShared = useTranslations("shared");
  const tCategories = useTranslations("categories");
  const locale = resolveLocale(useLocale());
  const dateFnsLocale = useDateFnsLocale();
  const { data: currentUser } = useConvexQuery(api.users.me);
  const deleteExpense = useConvexMutation(api.expenses.deleteExpense);

  if (!expenses || !expenses.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("empty")}
        </CardContent>
      </Card>
    );
  }

  const getUserDetails = (userId: Id<"users">) => {
    return {
      name:
        userId === currentUser?.id
          ? tShared("you")
          : userLookupMap[userId]?.name || tShared("otherUser"),
      imageUrl: userLookupMap[userId]?.imageUrl ?? undefined,
      id: userId,
    };
  };

  const canDeleteExpense = (expense: ExpenseListItem) => {
    if (!currentUser) return false;
    return (
      expense.createdBy === currentUser.id ||
      expense.paidByUserId === currentUser.id
    );
  };

  const handleDeleteExpense = async (expense: ExpenseListItem) => {
    const confirmed = window.confirm(t("deleteConfirm"));

    if (!confirmed) return;

    try {
      await deleteExpense.mutate({ expenseId: expense._id });
      toast.success(t("toastDeleted"));
    } catch (error) {
      toast.error(
        t("toastDeleteFailed", {
          message: getConvexErrorFromUnknown(error, locale),
        })
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {expenses.map((expense: ExpenseListItem) => {
        const payer = getUserDetails(expense.paidByUserId);
        const isCurrentUserPayer = expense.paidByUserId === currentUser?.id;
        const categoryId = expense.category ?? "other";
        const CategoryIcon = getCategoryIcon(categoryId);
        const showDeleteOption = canDeleteExpense(expense);

        return (
          <Card
            className="hover:bg-muted/30 transition-colors"
            key={expense._id}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <h3 className="font-medium">{expense.description}</h3>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <span>
                        {formatDate(new Date(expense.date), "d.M.yyyy", {
                          locale: dateFnsLocale,
                        })}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: getCategoryColor(categoryId) }}
                          aria-hidden
                        />
                        {getCategoryLabel(tCategories, categoryId)}
                      </span>
                      {showOtherPerson && !isGroupExpense && (
                        <>
                          <span>•</span>
                          <span>
                            {isCurrentUserPayer
                              ? t("youPaid")
                              : t("userPaid", { name: payer.name })}
                          </span>
                        </>
                      )}
                    </div>

                    {expense.splits && expense.splits.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {expense.splits.map(
                          (split: ExpenseSplitRow, idx: number) => {
                            const user = getUserDetails(split.userId);
                            return (
                              <Badge
                                key={`${split.userId}-${idx}`}
                                variant="outline"
                                className="text-xs"
                              >
                                {user.name}: {formatAmount(split.amount, expense.currency)}
                              </Badge>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium">
                      {formatAmount(expense.amount, expense.currency)}
                    </div>
                    {isGroupExpense && (
                      <Badge variant="outline" className="mt-1">
                        {t("groupExpenseBadge")}
                      </Badge>
                    )}
                  </div>

                  {showDeleteOption && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExpense(expense)}
                      aria-label={t("deleteAria")}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
