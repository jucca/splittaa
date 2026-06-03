"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils";
import { ExpenseSummary } from "@/components/features/dashboard/expense-summary";
import { BalanceSummary } from "@/components/features/dashboard/balance-summary";
import { GroupList } from "@/components/features/dashboard/group-list";
import { PendingGroupInvites } from "@/components/features/groups/pending-group-invites";
import { JoinByCodeForm } from "@/components/features/groups/join-by-code-form";

export default function Dashboard() {
  const { data: balances, isLoading: balancesLoading } = useConvexQuery(
    api.dashboard.getUserBalances
  );

  const { data: groups, isLoading: groupsLoading } = useConvexQuery(
    api.dashboard.getUserGroups
  );

  const { data: totalSpent, isLoading: totalSpentLoading } = useConvexQuery(
    api.dashboard.getTotalSpent
  );

  const { data: monthlySpending, isLoading: monthlySpendingLoading } =
    useConvexQuery(api.dashboard.getMonthlySpending);

  const isLoading =
    balancesLoading ||
    groupsLoading ||
    totalSpentLoading ||
    monthlySpendingLoading;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {isLoading ? (
        <div className="w-full py-12 flex justify-center">
          <BarLoader width={"100%"} color="#36d7b7" />
        </div>
      ) : (
        <>
          <PendingGroupInvites />
          <JoinByCodeForm />

          <div className="flex  justify-between flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-5xl gradient-title">Etusivu</h1>
            <Button asChild>
              <Link href="/expenses/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Lisää kulu
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Kokonaissaldo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold"
                  data-testid="dashboard-balance"
                >
                  {balances?.totalBalance > 0 ? (
                    <span className="text-green-600">
                      {formatSignedCurrency(balances?.totalBalance)}
                    </span>
                  ) : balances?.totalBalance < 0 ? (
                    <span className="text-red-600">
                      {formatSignedCurrency(balances?.totalBalance)}
                    </span>
                  ) : (
                    <span>{formatCurrency(0)}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {balances?.totalBalance > 0
                    ? "Sinulle ollaan velkaa"
                    : balances?.totalBalance < 0
                      ? "Olet velkaa"
                      : "Kaikki tasoitettu!"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sinulle ollaan velkaa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(balances?.youAreOwed)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {balances?.oweDetails?.youAreOwedBy?.length || 0} henkilöltä
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Olet velkaa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {balances?.oweDetails?.youOwe?.length > 0 ? (
                  <>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(balances?.youOwe)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {balances?.oweDetails?.youOwe?.length || 0} henkilölle
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Et ole velkaa kenellekään
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ExpenseSummary
                monthlySpending={monthlySpending}
                totalSpent={totalSpent}
              />
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Saldotiedot</CardTitle>
                    <Button variant="link" asChild className="p-0">
                      <Link href="/contacts">
                        Näytä kaikki
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <BalanceSummary balances={balances} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Ryhmäsi</CardTitle>
                    <Button variant="link" asChild className="p-0">
                      <Link href="/contacts">
                        Näytä kaikki
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <GroupList groups={groups} />
                </CardContent>
                <CardFooter>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/contacts?createGroup=true">
                      <Users className="mr-2 h-4 w-4" />
                      Luo uusi ryhmä
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
