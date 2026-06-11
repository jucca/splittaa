"use client";

import Link from "next/link";
import { format as formatDate } from "date-fns";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMoney } from "@/components/providers/money-format-provider";
import {
  ArrowLeftRight,
  Receipt,
  Users,
  User,
  ChevronRight,
} from "lucide-react";
import { ActivityFeedSkeleton } from "@/components/features/activity/activity-feed-skeleton";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import type { FunctionReturnType } from "convex/server";
import { useTranslations } from "next-intl";
import { useDateFnsLocale } from "@/lib/i18n/use-date-fns-locale";

type ActivityEntry = FunctionReturnType<
  typeof api.activity.getRecentActivity
>[number];

export function ActivityFeed() {
  const t = useTranslations("activity");
  const dateFnsLocale = useDateFnsLocale();
  const { data: items, isLoading } = useConvexQuery(
    api.activity.getRecentActivity,
    { limit: 50 }
  );

  if (isLoading) {
    return <ActivityFeedSkeleton />;
  }

  if (!items?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t("feedEmpty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimatedList
      as="ul"
      className="flex flex-col gap-3"
      aria-label={t("feedAria")}
    >
      {items.map((item: ActivityEntry) => (
        <AnimatedListItem as="li" id={item.id} key={item.id}>
          <ActivityRow item={item} dateFnsLocale={dateFnsLocale} />
        </AnimatedListItem>
      ))}
    </AnimatedList>
  );
}

function ActivityRow({
  item,
  dateFnsLocale,
}: {
  item: ActivityEntry;
  dateFnsLocale: ReturnType<typeof useDateFnsLocale>;
}) {
  const tShared = useTranslations("shared");
  const { format: formatAmount } = useMoney();
  const Icon = item.kind === "settlement" ? ArrowLeftRight : Receipt;
  const ContextIcon = item.contextType === "group" ? Users : User;
  const dateLabel = formatDate(new Date(item.date), "d.M.yyyy 'klo' HH:mm", {
    locale: dateFnsLocale,
  });

  return (
    <Link href={item.href} className="block group">
      <Card className="hover:bg-muted/40 transition-colors">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="bg-primary/10 p-2 rounded-full shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {item.subtitle}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{dateLabel}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <ContextIcon className="h-3 w-3" />
                    {item.contextType === "group"
                      ? tShared("group")
                      : tShared("person")}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {item.kind === "expense"
                      ? tShared("expenseKind")
                      : tShared("settlementKind")}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold tabular-nums">
                {formatAmount(item.amount)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
