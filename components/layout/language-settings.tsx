"use client";

import { useMutation } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
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
import { useConvexAuth } from "convex/react";
import { Languages } from "lucide-react";
import {
  SUPPORTED_LOCALES,
  resolveLocale,
  type AppLocale,
} from "@/lib/i18n/locales";
import { useSwitchLocale } from "@/lib/i18n/use-switch-locale";
import { HoverHint } from "@/components/ui/hover-hint";

export function LanguageSettings() {
  const t = useTranslations("settings");
  const locale = resolveLocale(useLocale());
  const switchLocale = useSwitchLocale();
  const { isAuthenticated } = useConvexAuth();
  const updateLocale = useMutation(api.users.updatePreferredLocale);

  const handleChange = async (next: AppLocale) => {
    if (next === locale) return;
    if (isAuthenticated) {
      try {
        await updateLocale({ locale: next });
      } catch {
        // Cookie + refresh still apply
      }
    }
    switchLocale(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          {t("languageCardTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="language-select">{t("languageLabel")}</Label>
        <Select value={locale} onValueChange={(v) => handleChange(v as AppLocale)}>
          <HoverHint
            label={`${t("languageLabel")} — ${t("languageHint")}`}
            side="top"
            fullWidth
          >
            <SelectTrigger
              id="language-select"
              className="w-full"
              data-testid="settings-language-select"
            >
              <SelectValue />
            </SelectTrigger>
          </HoverHint>
          <SelectContent>
            {SUPPORTED_LOCALES.map((item) => (
              <SelectItem
                key={item.code}
                value={item.code}
                data-testid={`settings-language-option-${item.code}`}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden>{item.flag}</span>
                  <span>{item.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t("languageHint")}</p>
      </CardContent>
    </Card>
  );
}
