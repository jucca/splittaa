"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { formatSignedCurrency } from "@/lib/utils";
import type { DashboardGroup } from "@/lib/types/domain";
import { useTranslations } from "next-intl";

export function GroupList({
  groups,
}: {
  groups: DashboardGroup[] | null | undefined;
}) {
  const t = useTranslations("dashboard");
  const tShared = useTranslations("shared");

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">{t("groupListEmpty")}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("groupListEmptyHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group: DashboardGroup) => {
        const balance = group.balance || 0;
        const hasBalance = balance !== 0;

        return (
          <Link
            href={`/groups/${group.id}`}
            key={group.id}
            className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-md">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{group.name}</p>
                <p className="text-xs text-muted-foreground">
                  {tShared("membersCount", { count: group.members.length })}
                </p>
              </div>
            </div>

            {hasBalance && (
              <span
                className={`text-sm font-medium ${
                  balance > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatSignedCurrency(balance)}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
