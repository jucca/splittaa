"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
import { useMoney } from "@/components/providers/money-format-provider";
import { useLocale, useTranslations } from "next-intl";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";

type SendDebtRequestButtonProps = {
  debtorUserId: Id<"users">;
  debtorName: string;
  amount: number;
  groupId?: Id<"groups">;
  groupName?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function SendDebtRequestButton({
  debtorUserId,
  debtorName,
  amount,
  groupId,
  groupName,
  variant = "outline",
  size = "sm",
  className,
}: SendDebtRequestButtonProps) {
  const t = useTranslations("debtRequests");
  const tShared = useTranslations("shared");
  const locale = resolveLocale(useLocale());
  const { format } = useMoney();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const sendDebtRequest = useConvexMutation(api.debtRequests.sendDebtRequest);

  const handleSend = async () => {
    try {
      await sendDebtRequest.mutate({
        debtorUserId,
        groupId,
        message: message.trim() || undefined,
      });
      toast.success(t("toastSent", { debtorName }));
      setOpen(false);
      setMessage("");
    } catch (error) {
      const data = (error as { data?: { code?: string; message?: string } })
        ?.data;
      toast.error(
        data?.message ?? getConvexErrorFromUnknown(error, locale) ?? t("toastSendFailed")
      );
    }
  };

  const contextLabel = groupName
    ? t("contextGroup", { groupName })
    : t("contextPersonal");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={className}
          data-testid="send-debt-request"
        >
          <Send className="h-4 w-4 mr-1" />
          {t("sendButton")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("dialogDescription", {
              debtorName,
              amount: format(amount),
              context: contextLabel,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="debt-request-message">{t("messageLabel")}</Label>
          <Textarea
            id="debt-request-message"
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
            disabled={sendDebtRequest.isLoading}
          >
            {sendDebtRequest.isLoading ? tShared("sending") : t("sendRequest")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
