"use client";

import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useMoney } from "@/components/providers/money-format-provider";
import { useLocale, useTranslations } from "next-intl";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";

type DebtRequestActionsProps = {
  notificationId: Id<"notifications">;
  href: string | null;
  canMarkPaid: boolean;
  debtRequestRespondedAt: number | null;
  settlementHref?: string;
};

export function DebtRequestActions({
  notificationId,
  href,
  canMarkPaid,
  debtRequestRespondedAt,
  settlementHref,
}: DebtRequestActionsProps) {
  const t = useTranslations("inbox.actions");
  const tInbox = useTranslations("inbox");
  const tShared = useTranslations("shared");
  const locale = resolveLocale(useLocale());
  const { format } = useMoney();
  const respond = useConvexMutation(api.debtRequests.respondToDebtRequest);
  const markAsRead = useConvexMutation(api.notifications.markAsRead);

  const handleMarkPaid = async () => {
    try {
      const result = await respond.mutate({ notificationId });
      toast.success(
        t("toastMarkedPaid", {
          amount: format(result.amount),
          creditorName: result.creditorName,
        })
      );
    } catch (error) {
      const data = (error as { data?: { code?: string; message?: string } })
        ?.data;
      if (data?.code === "ALREADY_SETTLED") {
        toast.info(data.message);
        return;
      }
      toast.error(
        data?.message ?? getConvexErrorFromUnknown(error, locale) ?? t("toastRecordFailed")
      );
    }
  };

  if (debtRequestRespondedAt) {
    return (
      <Badge variant="outline" className="text-green-700 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {t("markedPaid")}
      </Badge>
    );
  }

  const tilitysLink = settlementHref ?? href;

  return (
    <div className="flex flex-wrap gap-2">
      {canMarkPaid && (
        <Button
          type="button"
          size="sm"
          onClick={handleMarkPaid}
          disabled={respond.isLoading}
          data-testid="mark-debt-request-paid"
        >
          {respond.isLoading ? tShared("recording") : t("markPaid")}
        </Button>
      )}
      {tilitysLink && (
        <Button size="sm" variant="outline" asChild>
          <Link href={tilitysLink}>{t("openSettlement")}</Link>
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => markAsRead.mutate({ notificationId })}
        disabled={markAsRead.isLoading}
      >
        {tInbox("markRead")}
      </Button>
    </div>
  );
}
