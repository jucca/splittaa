"use client";

import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InboxFeedSkeleton } from "@/components/features/inbox/inbox-feed-skeleton";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { Bell, CheckCircle2, Mail, Send, Wallet } from "lucide-react";
import { DebtRequestActions } from "@/components/features/inbox/debt-request-actions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";
import { useDateFnsLocale } from "@/lib/i18n/use-date-fns-locale";
import { useLocale } from "next-intl";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";
import { useMoney } from "@/components/providers/money-format-provider";

type InboxMessage = FunctionReturnType<
  typeof api.notifications.listMyNotifications
>[number];

const TRANSLATED_NOTIFICATION_TYPES = [
  "group_invite",
  "balance_reminder",
  "debt_request",
  "debt_request_paid",
] as const;

type TranslatedNotificationType =
  (typeof TRANSLATED_NOTIFICATION_TYPES)[number];

function isTranslatedType(
  type: string
): type is TranslatedNotificationType {
  return (TRANSLATED_NOTIFICATION_TYPES as readonly string[]).includes(type);
}

function getNotificationDisplay(
  message: InboxMessage,
  tNotif: ReturnType<typeof useTranslations<"notifications">>,
  formatAmount: (amount: number) => string
): { title: string; body: string } {
  if (!isTranslatedType(message.type)) {
    return { title: message.title, body: message.body };
  }

  try {
    switch (message.type) {
      case "group_invite": {
        const fromTitle = message.title.replace(/^Kutsu ryhmään:\s*/i, "").trim();
        const fromBody = message.body.match(/ryhmään ([^.]+)/)?.[1]?.trim();
        const groupName = fromTitle || fromBody;
        if (groupName) {
          return {
            title: tNotif("group_invite.title"),
            body: tNotif("group_invite.body", { groupName }),
          };
        }
        break;
      }
      case "balance_reminder":
        return {
          title: tNotif("balance_reminder.title"),
          body: tNotif("balance_reminder.body", { summary: message.body }),
        };
      case "debt_request": {
        if (message.debtRequestAmount != null) {
          const match = message.body.match(/^(.+?) pyytää sinua maksamaan/);
          const creditorName = match?.[1]?.trim();
          if (creditorName) {
            return {
              title: tNotif("debt_request.title"),
              body: tNotif("debt_request.body", {
                creditorName,
                amount: formatAmount(message.debtRequestAmount),
              }),
            };
          }
        }
        break;
      }
      case "debt_request_paid": {
        const match = message.body.match(/^(.+?) merkitsi/);
        const debtorName = match?.[1]?.trim();
        const amountMatch = message.body.match(/\(([^)]+)\)/);
        const amount = amountMatch?.[1]?.trim();
        if (debtorName && amount) {
          return {
            title: tNotif("debt_request_paid.title"),
            body: tNotif("debt_request_paid.body", { debtorName, amount }),
          };
        }
        break;
      }
    }
  } catch {
    // fall through to server strings
  }

  return { title: message.title, body: message.body };
}

function NotificationIcon({
  type,
}: {
  type: TranslatedNotificationType;
}) {
  if (type === "group_invite") {
    return <Mail className="h-5 w-5 text-primary shrink-0" />;
  }
  if (type === "debt_request") {
    return <Send className="h-5 w-5 text-orange-600 shrink-0" />;
  }
  if (type === "debt_request_paid") {
    return <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />;
  }
  return <Wallet className="h-5 w-5 text-amber-600 shrink-0" />;
}

export function InboxFeed() {
  const t = useTranslations("inbox");
  const tNotif = useTranslations("notifications");
  const tShared = useTranslations("shared");
  const locale = resolveLocale(useLocale());
  const dateFnsLocale = useDateFnsLocale();
  const { format } = useMoney();
  const { data: messages, isLoading } = useConvexQuery(
    api.notifications.listMyNotifications,
    { limit: 50 }
  );
  const markAsRead = useConvexMutation(api.notifications.markAsRead);
  const markAllAsRead = useConvexMutation(api.notifications.markAllAsRead);

  const unreadCount =
    messages?.filter((m: InboxMessage) => !m.isRead).length ?? 0;

  const handleMarkRead = async (notificationId: Id<"notifications">) => {
    try {
      await markAsRead.mutate({ notificationId });
    } catch (error) {
      toast.error(getConvexErrorFromUnknown(error, locale));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const result = await markAllAsRead.mutate({});
      if (result.updated > 0) {
        toast.success(t("toastAllMarkedRead"));
      }
    } catch (error) {
      toast.error(getConvexErrorFromUnknown(error, locale));
    }
  };

  if (isLoading) {
    return <InboxFeedSkeleton />;
  }

  if (!messages?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>{t("empty")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllAsRead.isLoading}
          >
            {t("markAllRead")}
          </Button>
        </div>
      )}

      <AnimatedList as="ul" className="space-y-3" data-testid="inbox-feed">
        {messages.map((message: InboxMessage) => {
          const { title, body } = getNotificationDisplay(
            message,
            tNotif,
            (amount) => format(amount)
          );

          return (
            <AnimatedListItem as="li" id={message.id} key={message.id}>
              <Card
                className={
                  message.isRead
                    ? "opacity-80"
                    : "border-primary/30 bg-primary/5"
                }
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {isTranslatedType(message.type) ? (
                      <NotificationIcon type={message.type} />
                    ) : (
                      <Bell className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium leading-snug">{title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(message.createdAt, {
                              addSuffix: true,
                              locale: dateFnsLocale,
                            })}
                          </p>
                        </div>
                        {!message.isRead && (
                          <Badge variant="secondary">{tShared("newBadge")}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{body}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {message.type === "debt_request" ? (
                          <DebtRequestActions
                            notificationId={message.id}
                            href={message.href}
                            canMarkPaid={message.canMarkPaid}
                            debtRequestRespondedAt={message.debtRequestRespondedAt}
                            settlementHref={
                              message.debtRequestCreditorId
                                ? message.debtRequestGroupId
                                  ? `/settlements/group/${message.debtRequestGroupId}`
                                  : `/settlements/user/${message.debtRequestCreditorId}`
                                : (message.href ?? undefined)
                            }
                          />
                        ) : (
                          <>
                            {message.href && (
                              <Button size="sm" asChild>
                                <Link href={message.href}>
                                  {message.type === "group_invite"
                                    ? t("actions.openInvite")
                                    : message.type === "debt_request_paid"
                                      ? t("actions.viewBalance")
                                      : t("actions.openDashboard")}
                                </Link>
                              </Button>
                            )}
                            {!message.isRead && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkRead(message.id)}
                                disabled={markAsRead.isLoading}
                              >
                                {t("markRead")}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedListItem>
          );
        })}
      </AnimatedList>
    </div>
  );
}
