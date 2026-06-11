"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";

type SavingsGoal = {
  id: Id<"workspaceGoals">;
  label: string;
};

export function RecordDepositForm({
  workspaceId,
  goals,
}: {
  workspaceId: Id<"workspaces">;
  goals: SavingsGoal[];
}) {
  const t = useTranslations("workspaces");
  const tShared = useTranslations("shared");
  const locale = resolveLocale(useLocale());
  const recordDeposit = useConvexMutation(api.workspaces.recordDeposit);

  const [goalId, setGoalId] = useState<string>(goals[0]?.id ?? "");
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!goalId || isNaN(parsed) || parsed <= 0) return;

    try {
      await recordDeposit.mutate({
        workspaceId,
        goalId: goalId as Id<"workspaceGoals">,
        amount: parsed,
      });
      toast.success(t("toastDepositRecorded"));
      setAmount("");
    } catch (error) {
      toast.error(getConvexErrorFromUnknown(error, locale));
    }
  };

  if (!goals.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{t("recordDepositTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="deposit-goal">{t("depositGoalLabel")}</Label>
            <Select value={goalId} onValueChange={setGoalId}>
              <SelectTrigger id="deposit-goal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="deposit-amount">{t("depositAmountLabel")}</Label>
            <Input
              id="deposit-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={recordDeposit.isLoading || !amount.trim()}
            >
              {recordDeposit.isLoading ? tShared("recording") : t("recordDeposit")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
