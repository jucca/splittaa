"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeftRight,
  Receipt,
  Users,
  User,
  ChevronRight,
} from "lucide-react";
import type { FunctionReturnType } from "convex/server";

type ActivityEntry = FunctionReturnType<
  typeof api.activity.getRecentActivity
>[number];

export function ActivityFeed() {
  const { data: items, isLoading } = useConvexQuery(
    api.activity.getRecentActivity,
    { limit: 50 }
  );

  if (isLoading) {
    return (
      <p className="text-center text-muted-foreground py-12">Ladataan…</p>
    );
  }

  if (!items?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Ei viimeaikaista toimintaa. Lisää kulu tai tilitys nähdäksesi ne
          täällä.
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Viimeaikainen toiminta">
      {items.map((item: ActivityEntry) => (
        <li key={item.id}>
          <ActivityRow item={item} />
        </li>
      ))}
    </ul>
  );
}

function ActivityRow({ item }: { item: ActivityEntry }) {
  const Icon = item.kind === "settlement" ? ArrowLeftRight : Receipt;
  const ContextIcon = item.contextType === "group" ? Users : User;
  const dateLabel = format(new Date(item.date), "d.M.yyyy 'klo' HH:mm", {
    locale: fi,
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
                    {item.contextType === "group" ? "Ryhmä" : "Henkilö"}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {item.kind === "expense" ? "Kulu" : "Tilitys"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold tabular-nums">
                {formatCurrency(item.amount)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
