"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getWorkspaceTheme } from "@/lib/workspace-themes";
import { LayoutDashboard, Plus } from "lucide-react";
import type { WorkspaceListItem } from "@/lib/types/domain";
import { useTranslations } from "next-intl";

export function WorkspaceSidebar() {
  const t = useTranslations("workspaces");
  const pathname = usePathname();
  const { data: workspaces, isLoading } = useConvexQuery(
    api.workspaces.listMine
  );

  const isGlobalHome = pathname === "/dashboard";

  return (
    <aside
      className="hidden lg:block w-56 shrink-0"
      data-testid="workspace-sidebar"
    >
      <nav className="sticky top-24 space-y-1">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isGlobalHome
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          {t("globalHome")}
        </Link>

        <div className="pt-3 pb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("sidebarTitle")}
        </div>

        {isLoading ? (
          <p className="px-3 text-sm text-muted-foreground">{t("loading")}</p>
        ) : workspaces?.length ? (
          workspaces.map((workspace: WorkspaceListItem) => {
            const theme = getWorkspaceTheme(workspace.themeId);
            const Icon = theme.icon;
            const href = `/tyopoyta/${workspace.id}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={workspace.id}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors border",
                  active
                    ? cn("bg-muted", theme.borderClass)
                    : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", theme.accentClass)} />
                <span className="truncate flex-1">{workspace.name}</span>
                {workspace.goalSummary && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {workspace.goalSummary.percent}%
                  </span>
                )}
              </Link>
            );
          })
        ) : (
          <p className="px-3 text-sm text-muted-foreground">{t("sidebarEmpty")}</p>
        )}

        <Button variant="outline" size="sm" className="w-full mt-2" asChild>
          <Link href="/tyopoydat/uusi">
            <Plus className="h-4 w-4 mr-1" />
            {t("createWorkspace")}
          </Link>
        </Button>
      </nav>
    </aside>
  );
}
