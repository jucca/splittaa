"use client";

import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox } from "lucide-react";
import { useTranslations } from "next-intl";
import { HoverHint } from "@/components/ui/hover-hint";

export function InboxNavLink({ className }: { className?: string }) {
  const { data: unreadCount } = useConvexQuery(api.notifications.getUnreadCount);
  const t = useTranslations("nav");

  const label = unreadCount
    ? t("inboxWithCount", { count: unreadCount })
    : t("inbox");

  return (
    <Link href="/viestit" className={className}>
      <Button
        variant="outline"
        className="hidden md:inline-flex items-center gap-2 hover:text-green-600 hover:border-green-600 transition relative"
      >
        <Inbox className="h-4 w-4" />
        {label}
        {unreadCount ? (
          <Badge
            variant="destructive"
            className="ml-1 h-5 min-w-5 px-1.5 text-xs"
            data-testid="inbox-unread-badge"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        ) : null}
      </Button>
      <HoverHint label={label} side="bottom">
        <Button variant="ghost" className="md:hidden w-10 h-10 p-0 relative">
          <Inbox className="h-4 w-4" />
          {unreadCount ? (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white"
              data-testid="inbox-unread-badge"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
          <span className="sr-only">{label}</span>
        </Button>
      </HoverHint>
    </Link>
  );
}
