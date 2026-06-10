"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";

type DebtorSummary = {
  name: string;
  amount: number;
};

type SendAllDebtRequestsButtonProps = {
  debtors: DebtorSummary[];
  className?: string;
};

export function SendAllDebtRequestsButton({
  debtors,
  className,
}: SendAllDebtRequestsButtonProps) {
  const t = useTranslations("debtRequests");
  const tShared = useTranslations("shared");
  const locale = resolveLocale(useLocale());
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const sendBulk = useConvexMutation(api.debtRequests.sendDebtRequestsBulk);

  if (debtors.length === 0) return null;

  const handleSend = async () => {
    try {
      const result = await sendBulk.mutate({
        message: message.trim() || undefined,
      });

      const totalAttempted =
        result.sent + result.skippedCooldown + result.skippedNoDebt;

      if (result.sent > 0) {
        toast.success(
          t("toastBulkSent", {
            sent: result.sent,
            total: totalAttempted,
          })
        );
      }

      if (result.skippedCooldown > 0) {
        toast.info(
          t("toastBulkSkippedCooldown", { count: result.skippedCooldown })
        );
      }

      if (result.skippedNoDebt > 0) {
        toast.info(
          t("toastBulkSkippedNoDebt", { count: result.skippedNoDebt })
        );
      }

      if (
        result.sent === 0 &&
        result.skippedCooldown === 0 &&
        result.skippedNoDebt === 0
      ) {
        toast.info(t("toastBulkNoneSent"));
      }

      setOpen(false);
      setMessage("");
    } catch (error) {
      toast.error(
        getConvexErrorFromUnknown(error, locale) ?? t("toastSendFailed")
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={className}
          data-testid="send-all-debt-requests"
        >
          <Send className="h-4 w-4 mr-1" />
          {t("sendAllButton", { count: debtors.length })}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("bulkDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("bulkDialogDescription", { count: debtors.length })}
          </DialogDescription>
        </DialogHeader>
        <ul className="text-sm text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
          {debtors.map((debtor, index) => (
            <li key={`${debtor.name}-${index}`}>{debtor.name}</li>
          ))}
        </ul>
        <div className="space-y-2">
          <Label htmlFor="bulk-debt-request-message">{t("messageLabel")}</Label>
          <Textarea
            id="bulk-debt-request-message"
            placeholder={t("messagePlaceholder")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {tShared("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sendBulk.isLoading}
          >
            {sendBulk.isLoading ? tShared("sending") : t("sendAllConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
