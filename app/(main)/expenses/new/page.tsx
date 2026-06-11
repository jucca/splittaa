"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ExpenseForm } from "@/components/features/expenses/expense-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";

export default function NewExpensePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") as Id<"workspaces"> | null;
  const t = useTranslations("expenses");

  if (workspaceId) {
    return (
      <div className="container max-w-3xl mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-5xl gradient-title">{t("newPageTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("newWorkspaceSubtitle")}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <ExpenseForm
              type="workspace"
              workspaceId={workspaceId}
              onSuccess={(id) => router.push(`/tyopoyta/${id}`)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-5xl gradient-title">{t("newPageTitle")}</h1>
        <p className="text-muted-foreground mt-1">{t("newPageSubtitle")}</p>
      </div>

      <Card>
        <CardContent>
          <Tabs className="pb-3" defaultValue="individual">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">{t("tabIndividual")}</TabsTrigger>
              <TabsTrigger value="group">{t("tabGroup")}</TabsTrigger>
            </TabsList>
            <TabsContent value="individual" className="mt-0">
              <ExpenseForm
                type="individual"
                onSuccess={() => router.push("/dashboard")}
              />
            </TabsContent>
            <TabsContent value="group" className="mt-0">
              <ExpenseForm
                type="group"
                onSuccess={(id) => router.push(`/groups/${id}`)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
