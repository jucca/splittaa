"use client";

import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

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
  const respond = useConvexMutation(api.debtRequests.respondToDebtRequest);
  const markAsRead = useConvexMutation(api.notifications.markAsRead);

  const handleMarkPaid = async () => {
    try {
      const result = await respond.mutate({ notificationId });
      toast.success(
        `Maksu kirjattu (${formatCurrency(result.amount)}). ${result.creditorName} saa ilmoituksen.`
      );
    } catch (error) {
      const data = (error as { data?: { code?: string; message?: string } })
        ?.data;
      if (data?.code === "ALREADY_SETTLED") {
        toast.info(data.message);
        return;
      }
      const fallback =
        error instanceof Error ? error.message : "Kirjaus epäonnistui";
      toast.error(data?.message ?? fallback);
    }
  };

  if (debtRequestRespondedAt) {
    return (
      <Badge variant="outline" className="text-green-700 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Maksetuksi merkitty
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
          {respond.isLoading ? "Kirjataan..." : "Merkitse maksetuksi"}
        </Button>
      )}
      {tilitysLink && (
        <Button size="sm" variant="outline" asChild>
          <Link href={tilitysLink}>Avaa tilitys</Link>
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => markAsRead.mutate({ notificationId })}
        disabled={markAsRead.isLoading}
      >
        Merkitse luetuksi
      </Button>
    </div>
  );
}
