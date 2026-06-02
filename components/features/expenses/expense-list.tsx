"use client";

import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCategoryById, getCategoryIcon } from "@/lib/expense-categories";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

type ExpenseSplitRow = {
  userId: Id<"users">;
  amount: number;
};

export type ExpenseListItem = {
  _id: Id<"expenses">;
  description: string;
  amount: number;
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
  const { data: currentUser } = useConvexQuery(api.users.me);
  const deleteExpense = useConvexMutation(api.expenses.deleteExpense);

  if (!expenses || !expenses.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Kuluja ei löytynyt
        </CardContent>
      </Card>
    );
  }

  const getUserDetails = (userId: Id<"users">) => {
    return {
      name:
        userId === currentUser?.id
          ? "Sinä"
          : userLookupMap[userId]?.name || "Muu käyttäjä",
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
    const confirmed = window.confirm(
      "Haluatko varmasti poistaa tämän kulun? Toimintoa ei voi perua."
    );

    if (!confirmed) return;

    try {
      await deleteExpense.mutate({ expenseId: expense._id });
      toast.success("Kulu poistettu onnistuneesti");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error("Kulun poisto epäonnistui: " + message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {expenses.map((expense: ExpenseListItem) => {
        const payer = getUserDetails(expense.paidByUserId);
        const isCurrentUserPayer = expense.paidByUserId === currentUser?.id;
        const category = getCategoryById(expense.category ?? "other");
        const CategoryIcon = getCategoryIcon(category.id);
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
                        {format(new Date(expense.date), "d.M.yyyy", {
                          locale: fi,
                        })}
                      </span>
                      <span>•</span>
                      <span>{category.name}</span>
                      {showOtherPerson && !isGroupExpense && (
                        <>
                          <span>•</span>
                          <span>
                            {isCurrentUserPayer
                              ? "Sinä maksoit"
                              : `${payer.name} maksoi`}
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
                                {user.name}: {formatCurrency(split.amount)}
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
                      {formatCurrency(expense.amount)}
                    </div>
                    {isGroupExpense && (
                      <Badge variant="outline" className="mt-1">
                        Ryhmäkulu
                      </Badge>
                    )}
                  </div>

                  {showDeleteOption && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExpense(expense)}
                      aria-label="Poista kulu"
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
