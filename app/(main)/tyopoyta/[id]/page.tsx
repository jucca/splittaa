"use client";

import { use } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { DashboardSkeleton } from "@/components/features/dashboard/dashboard-skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useMoney } from "@/components/providers/money-format-provider";
import { ExpenseSummary } from "@/components/features/dashboard/expense-summary";
import { BalanceSummary } from "@/components/features/dashboard/balance-summary";
import { WorkspaceGoalsSummary } from "@/components/features/workspaces/workspace-goals-summary";
import { WorkspaceMemberList } from "@/components/features/workspaces/workspace-member-list";
import { WorkspaceJoinByCodeForm } from "@/components/features/workspaces/workspace-join-by-code-form";
import { WorkspaceInviteShare } from "@/components/features/workspaces/workspace-invite-share";
import { RecordDepositForm } from "@/components/features/workspaces/record-deposit-form";
import { getWorkspaceTheme } from "@/lib/workspace-themes";
import { cn } from "@/lib/utils";
import type { WorkspaceGoalView } from "@/lib/types/domain";
import { useTranslations } from "next-intl";

export default function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const workspaceId = id as Id<"workspaces">;
  const t = useTranslations("workspaces");
  const tDash = useTranslations("dashboard");
  const { format, formatSigned } = useMoney();

  const { data: workspace, isLoading: workspaceLoading } = useConvexQuery(
    api.workspaces.get,
    { workspaceId }
  );
  const { data: goals, isLoading: goalsLoading } = useConvexQuery(
    api.workspaces.getGoals,
    { workspaceId }
  );
  const { data: balances, isLoading: balancesLoading } = useConvexQuery(
    api.workspaces.getBalances,
    { workspaceId }
  );
  const { data: totalSpent, isLoading: totalSpentLoading } = useConvexQuery(
    api.workspaces.getTotalSpent,
    { workspaceId }
  );
  const { data: monthlySpending, isLoading: monthlySpendingLoading } =
    useConvexQuery(api.workspaces.getMonthlySpending, { workspaceId });
  const { data: members, isLoading: membersLoading } = useConvexQuery(
    api.workspaces.getMembers,
    { workspaceId }
  );

  const isLoading =
    workspaceLoading ||
    goalsLoading ||
    balancesLoading ||
    totalSpentLoading ||
    monthlySpendingLoading ||
    membersLoading;

  const theme = getWorkspaceTheme(workspace?.themeId ?? "yleinen");
  const ThemeIcon = theme.icon;
  const savingsGoals =
    goals?.filter((g: WorkspaceGoalView) => g.type === "savings_target") ?? [];

  return (
    <div
      className={cn(
        "space-y-6 py-6 rounded-xl",
        workspace && `bg-gradient-to-b ${theme.gradientClass}`
      )}
    >
      {isLoading ? (
        <DashboardSkeleton />
      ) : workspace ? (
        <>
          <div className="flex justify-between flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <ThemeIcon className={cn("h-8 w-8", theme.accentClass)} />
              <h1 className="text-5xl gradient-title">{workspace.name}</h1>
            </div>
            <Button asChild>
              <Link href={`/expenses/new?workspaceId=${workspaceId}`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {tDash("addExpense")}
              </Link>
            </Button>
          </div>

          <WorkspaceGoalsSummary goals={goals} />

          {savingsGoals.length > 0 && (
            <RecordDepositForm workspaceId={workspaceId} goals={savingsGoals} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={theme.borderClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {tDash("totalBalance")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {balances && balances.totalBalance > 0 ? (
                    <span className="text-green-600">
                      {formatSigned(balances.totalBalance)}
                    </span>
                  ) : balances && balances.totalBalance < 0 ? (
                    <span className="text-red-600">
                      {formatSigned(balances.totalBalance)}
                    </span>
                  ) : (
                    <span>{format(0)}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className={theme.borderClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {tDash("balanceOwedToYou")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {format(balances?.youAreOwed ?? 0)}
                </div>
              </CardContent>
            </Card>

            <Card className={theme.borderClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {tDash("balanceYouOwe")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {format(balances?.youOwe ?? 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ExpenseSummary
                monthlySpending={monthlySpending?.months}
                totalSpent={totalSpent?.total}
              />
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>{tDash("balanceSummaryTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <BalanceSummary balances={balances} showDebtActions={false} />
                </CardContent>
              </Card>

              <WorkspaceInviteShare
                workspaceId={workspaceId}
                isAdmin={workspace.isAdmin}
              />
              <WorkspaceJoinByCodeForm />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>{t("membersTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkspaceMemberList members={members} />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">{t("notFound")}</p>
      )}
    </div>
  );
}
