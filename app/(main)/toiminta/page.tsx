"use client";

import Link from "next/link";
import { ActivityFeed } from "@/components/features/activity/activity-feed";
import { SpendingCharts } from "@/components/features/activity/spending-charts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ActivityPage() {
  const t = useTranslations("activity");
  const tShared = useTranslations("shared");

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tShared("back")}
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-md">
          <History className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl gradient-title">{t("pageTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("pageSubtitle")}</p>
        </div>
      </div>

      <SpendingCharts />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("recentEventsTitle")}</h2>
        <ActivityFeed />
      </div>
    </div>
  );
}
