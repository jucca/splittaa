"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { useDateFnsLocale } from "@/lib/i18n/use-date-fns-locale";

type OpenInviteInfo = {
  token: string;
  displayCode: string;
  joinUrl: string;
  expiresAt: number;
};

export function GroupInviteShare({ openInvite }: { openInvite: OpenInviteInfo }) {
  const t = useTranslations("groups");
  const dateFnsLocale = useDateFnsLocale();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  useEffect(() => {
    QRCode.toDataURL(openInvite.joinUrl, { width: 200, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [openInvite.joinUrl]);

  const copyToClipboard = async (text: string, kind: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success(
        kind === "link" ? t("toastLinkCopied") : t("toastCodeCopied")
      );
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t("toastCopyFailed"));
    }
  };

  const expiresLabel = format(new Date(openInvite.expiresAt), "PPP", {
    locale: dateFnsLocale,
  });

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">
        {t("shareInviteHint", { expiresDate: expiresLabel })}
      </p>

      {qrDataUrl && (
        <div className="flex justify-center">
          <img
            src={qrDataUrl}
            alt={t("qrAlt")}
            className="rounded-md border bg-white p-2"
            width={200}
            height={200}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>{t("joinLinkLabel")}</Label>
        <div className="flex gap-2">
          <Input readOnly value={openInvite.joinUrl} className="text-xs" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => copyToClipboard(openInvite.joinUrl, "link")}
            aria-label={t("copyLinkAria")}
          >
            {copied === "link" ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("joinCodeLabel")}</Label>
        <div className="flex gap-2">
          <Input
            readOnly
            value={openInvite.displayCode}
            className="font-mono text-lg tracking-widest"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => copyToClipboard(openInvite.displayCode, "code")}
            aria-label={t("copyCodeAria")}
          >
            {copied === "code" ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
