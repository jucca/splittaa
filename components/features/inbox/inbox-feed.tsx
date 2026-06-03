"use client";

import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";

type InboxMessage = FunctionReturnType<
  typeof api.notifications.listMyNotifications
>[number];
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarLoader } from "react-spinners";
import { Bell, CheckCircle2, Mail, Send, Wallet } from "lucide-react";
import { DebtRequestActions } from "@/components/features/inbox/debt-request-actions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fi } from "date-fns/locale";

function NotificationIcon({
  type,
}: {
  type: "group_invite" | "balance_reminder" | "debt_request" | "debt_request_paid";
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
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const result = await markAllAsRead.mutate({});
      if (result.updated > 0) {
        toast.success("Kaikki viestit merkitty luetuiksi");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-12 flex justify-center">
        <BarLoader width="100%" color="#36d7b7" />
      </div>
    );
  }

  if (!messages?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Ei viestejä. Ryhmäkutsut ja saldomuistutukset näkyvät täällä.</p>
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
            Merkitse kaikki luetuiksi
          </Button>
        </div>
      )}

      <ul className="space-y-3" data-testid="inbox-feed">
        {messages.map((message: InboxMessage) => (
          <li key={message.id}>
            <Card
              className={
                message.isRead ? "opacity-80" : "border-primary/30 bg-primary/5"
              }
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <NotificationIcon type={message.type} />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium leading-snug">{message.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(message.createdAt, {
                            addSuffix: true,
                            locale: fi,
                          })}
                        </p>
                      </div>
                      {!message.isRead && (
                        <Badge variant="secondary">Uusi</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{message.body}</p>
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
                                  ? "Avaa kutsu"
                                  : message.type === "debt_request_paid"
                                    ? "Näytä saldo"
                                    : "Avaa etusivu"}
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
                              Merkitse luetuksi
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
