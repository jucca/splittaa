"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMoney } from "@/components/providers/money-format-provider";
import { useTranslations } from "next-intl";

type WorkspaceGoal = {
  id: string;
  type: "budget_cap" | "savings_target";
  label: string;
  targetAmount: number;
  currency: string;
  current: number;
  percent: number;
  remaining: number;
};

export function WorkspaceGoalsSummary({
  goals,
}: {
  goals: WorkspaceGoal[] | null | undefined;
}) {
  const t = useTranslations("workspaces");
  const { format } = useMoney();

  if (!goals?.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="workspace-goals">
      {goals.map((goal) => (
        <Card key={goal.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between gap-2">
              <span>{goal.label}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {goal.type === "budget_cap"
                  ? t("goalTypeBudget")
                  : t("goalTypeSavings")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, goal.percent)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span>
                {format(goal.current)} / {format(goal.targetAmount)}
              </span>
              <span className="text-muted-foreground">
                {goal.type === "budget_cap"
                  ? t("budgetRemaining", { amount: format(goal.remaining) })
                  : t("savingsRemaining", { amount: format(goal.remaining) })}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
