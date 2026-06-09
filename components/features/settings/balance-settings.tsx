"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Scale } from "lucide-react";
import { HoverHint } from "@/components/ui/hover-hint";

export function BalanceSettings() {
  const t = useTranslations("settings");
  const settings = useQuery(api.settings.getBalanceSettings);
  const updateSettings = useMutation(api.settings.updateBalanceSettings);
  const autoNetBalances = settings?.autoNetBalances ?? true;

  const handleToggle = async (checked: boolean) => {
    if (autoNetBalances === checked) return;
    try {
      await updateSettings({ autoNetBalances: checked });
      toast.success(t("toastSaved"));
    } catch {
      toast.error(t("toastSaveFailed", { message: "" }));
    }
  };

  return (
    <Card data-testid="settings-balance-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          {t("balanceCardTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="auto-net-balances">
              {t("autoNetBalancesLabel")}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t("autoNetBalancesHint")}
            </p>
          </div>
          <HoverHint
            label={`${t("autoNetBalancesLabel")} — ${t("autoNetBalancesHint")}`}
            side="left"
          >
            <input
              id="auto-net-balances"
              type="checkbox"
              className="h-5 w-5 rounded border"
              checked={autoNetBalances}
              onChange={(e) => handleToggle(e.target.checked)}
              data-testid="settings-auto-net-balances"
            />
          </HoverHint>
        </div>
      </CardContent>
    </Card>
  );
}
