"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins } from "lucide-react";
import {
  SUPPORTED_CURRENCIES,
  resolveCurrency,
  type CurrencyCode,
} from "@/lib/money/currencies";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { HoverHint } from "@/components/ui/hover-hint";

export function CurrencySettings() {
  const t = useTranslations("settings");
  const { data: me } = useConvexQuery(api.users.me);
  const updateCurrency = useMutation(api.users.updatePreferredCurrency);
  const currency = resolveCurrency(me?.preferredCurrency ?? undefined);

  const handleChange = async (next: CurrencyCode) => {
    if (next === currency) return;
    await updateCurrency({ currency: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          {t("currencyCardTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="currency-select">{t("currencyLabel")}</Label>
        <Select value={currency} onValueChange={(v) => handleChange(v as CurrencyCode)}>
          <HoverHint
            label={`${t("currencyLabel")} — ${t("currencyHint")}`}
            side="top"
          >
            <SelectTrigger
              id="currency-select"
              className="w-full"
              data-testid="settings-currency-select"
            >
              <SelectValue />
            </SelectTrigger>
          </HoverHint>
          <SelectContent>
            {SUPPORTED_CURRENCIES.map((item) => (
              <SelectItem
                key={item.code}
                value={item.code}
                data-testid={`settings-currency-option-${item.code}`}
              >
                <span className="flex items-center gap-2">
                  <span>{item.symbol}</span>
                  <span>
                    {item.code} — {item.label}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t("currencyHint")}</p>
      </CardContent>
    </Card>
  );
}
