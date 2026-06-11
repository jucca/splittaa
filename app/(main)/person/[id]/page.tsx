"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { ExpensesPageSkeleton } from "@/components/features/expenses/expenses-page-skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ArrowLeftRight, ArrowLeft } from "lucide-react";
import { ExpenseList } from "@/components/features/expenses/expense-list";
import { SettlementList } from "@/components/features/settlements/settlement-list";
import { useMoney } from "@/components/providers/money-format-provider";
import { SendDebtRequestButton } from "@/components/features/debt-requests/send-debt-request-button";
import type { Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";

export default function PersonExpensesPage() {
  const t = useTranslations("person");
  const tShared = useTranslations("shared");
  const { format } = useMoney();
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("expenses");

  const { data, isLoading } = useConvexQuery(
    api.expenses.getExpensesBetweenUsers,
    { userId: params.id }
  );

  if (isLoading) {
    return <ExpensesPageSkeleton />;
  }

  const otherUser = data?.otherUser;
  const expenses = data?.expenses || [];
  const settlements = data?.settlements || [];
  const balance = data?.balance || 0;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tShared("back")}
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={otherUser?.imageUrl} />
              <AvatarFallback>
                {otherUser?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl gradient-title">{otherUser?.name}</h1>
              <p className="text-muted-foreground">{otherUser?.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/settlements/user/${params.id}`}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                {t("settleUp")}
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/expenses/new`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t("addExpense")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{t("balanceTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {balance === 0 ? (
                <p>{t("allSettled")}</p>
              ) : balance > 0 ? (
                <p>
                  {t("theyOweYou", { name: otherUser?.name ?? "" })}
                </p>
              ) : (
                <p>
                  {t("youOweThem", { name: otherUser?.name ?? "" })}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div
                className={`text-2xl font-bold ${balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : ""}`}
              >
                {format(Math.abs(balance))}
              </div>
              {balance > 0 && otherUser?.id && (
                <SendDebtRequestButton
                  debtorUserId={otherUser.id as Id<"users">}
                  debtorName={otherUser.name}
                  amount={balance}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        defaultValue="expenses"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">
            {t("tabsExpenses", { count: expenses.length })}
          </TabsTrigger>
          <TabsTrigger value="settlements">
            {t("tabsSettlements", { count: settlements.length })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseList
            expenses={expenses}
            showOtherPerson={false}
            otherPersonId={params.id as import("@/convex/_generated/dataModel").Id<"users">}
            userLookupMap={{ [otherUser.id]: otherUser }}
          />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <SettlementList
            settlements={settlements}
            userLookupMap={{ [otherUser.id]: otherUser }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
