"use client";

import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkspaceTheme } from "@/lib/workspace-themes";
import { cn } from "@/lib/utils";
import { Plus, ChevronRight } from "lucide-react";
import type { WorkspaceListItem } from "@/lib/types/domain";
import { useTranslations } from "next-intl";

export default function WorkspacesListPage() {
  const t = useTranslations("workspaces");
  const { data: workspaces, isLoading } = useConvexQuery(
    api.workspaces.listMine
  );

  return (
    <div className="space-y-6 py-6">
      <div className="flex justify-between items-center gap-4 flex-col sm:flex-row">
        <h1 className="text-5xl gradient-title">{t("listTitle")}</h1>
        <Button asChild>
          <Link href="/tyopoydat/uusi">
            <Plus className="mr-2 h-4 w-4" />
            {t("createWorkspace")}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{t("loading")}</p>
      ) : workspaces?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workspaces.map((workspace: WorkspaceListItem) => {
            const theme = getWorkspaceTheme(workspace.themeId);
            const Icon = theme.icon;
            return (
              <Link key={workspace.id} href={`/tyopoyta/${workspace.id}`}>
                <Card
                  className={`hover:bg-muted/40 transition-colors border ${theme.borderClass}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className={cn("h-5 w-5 shrink-0", theme.accentClass)} />
                      {workspace.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {t("memberCount", { count: workspace.memberCount })}
                      {workspace.goalSummary && (
                        <> · {workspace.goalSummary.label}</>
                      )}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <p>{t("listEmpty")}</p>
            <Button className="mt-4" asChild>
              <Link href="/tyopoydat/uusi">{t("createWorkspace")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
