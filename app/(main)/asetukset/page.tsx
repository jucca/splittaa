"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Bell } from "lucide-react";
import { toast } from "sonner";
import type {
  ReminderIntervalDays,
  ReminderMinAgeDays,
} from "@/lib/reminder-settings";
import { useLocale, useTranslations } from "next-intl";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { getIntlDateTimeLocale, resolveLocale } from "@/lib/i18n/locales";
import { LanguageSettings } from "@/components/layout/language-settings";
import { CurrencySettings } from "@/components/layout/currency-settings";
import { BalanceSettings } from "@/components/features/settings/balance-settings";
import { ProfileSettings } from "@/components/features/profile/profile-settings";
import { HoverHint } from "@/components/ui/hover-hint";

const INTERVAL_VALUES: ReminderIntervalDays[] = [3, 7, 14, 30];
const MIN_AGE_VALUES: ReminderMinAgeDays[] = [3, 7, 14, 30];

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tShared = useTranslations("shared");
  const locale = resolveLocale(useLocale());

  const intervalOptions = useMemo(
    () =>
      INTERVAL_VALUES.map((value) => ({
        value,
        label: tShared("daysOption", { count: value }),
      })),
    [tShared]
  );

  const minAgeOptions = useMemo(
    () =>
      MIN_AGE_VALUES.map((value) => ({
        value,
        label: tShared("daysOption", { count: value }),
      })),
    [tShared]
  );

  const { data: settings, isLoading } = useConvexQuery(
    api.settings.getReminderSettings
  );
  const updateSettings = useConvexMutation(api.settings.updateReminderSettings);

  const [enabled, setEnabled] = useState(true);
  const [intervalDays, setIntervalDays] = useState<ReminderIntervalDays>(7);
  const [minAgeDays, setMinAgeDays] = useState<ReminderMinAgeDays>(7);
  const [notifyWhenIOwe, setNotifyWhenIOwe] = useState(true);
  const [notifyWhenOwedToMe, setNotifyWhenOwedToMe] = useState(true);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.enabled);
    setIntervalDays(settings.intervalDays);
    setMinAgeDays(settings.minAgeDays);
    setNotifyWhenIOwe(settings.notifyWhenIOwe);
    setNotifyWhenOwedToMe(settings.notifyWhenOwedToMe);
    setDirty(false);
  }, [settings]);

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    if (!notifyWhenIOwe && !notifyWhenOwedToMe) {
      toast.error(t("toastSelectReminderType"));
      return;
    }
    try {
      await updateSettings.mutate({
        enabled,
        intervalDays,
        minAgeDays,
        notifyWhenIOwe,
        notifyWhenOwedToMe,
      });
      setDirty(false);
      toast.success(t("toastSaved"));
    } catch (error) {
      toast.error(
        t("toastSaveFailed", {
          message: getConvexErrorFromUnknown(error, locale),
        })
      );
    }
  };

  const dateTimeLocale = getIntlDateTimeLocale(locale);

  return (
    <div className="container mx-auto py-6 max-w-lg space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tShared("back")}
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-md">
          <Bell className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl gradient-title">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
      </div>

      <ProfileSettings />

      <LanguageSettings />

      <CurrencySettings />

      <BalanceSettings />

      <Card>
        <CardHeader>
          <CardTitle>{t("remindersCardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">{tShared("loading")}</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="reminders-enabled">
                    {t("remindersEnabled")}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t("remindersEnabledHint")}
                  </p>
                </div>
                <HoverHint
                  label={`${t("remindersEnabled")} — ${t("remindersEnabledHint")}`}
                  side="left"
                >
                  <input
                    id="reminders-enabled"
                    type="checkbox"
                    className="h-5 w-5 rounded border"
                    checked={enabled}
                    onChange={(e) => {
                      setEnabled(e.target.checked);
                      markDirty();
                    }}
                  />
                </HoverHint>
              </div>

              <div className="space-y-2">
                <Label>{t("remindMeLabel")}</Label>
                <Select
                  value={String(intervalDays)}
                  onValueChange={(v) => {
                    setIntervalDays(Number(v) as ReminderIntervalDays);
                    markDirty();
                  }}
                  disabled={!enabled}
                >
                  <HoverHint label={t("remindMeLabel")} side="top" fullWidth>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </HoverHint>
                  <SelectContent>
                    {intervalOptions.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("minAgeLabel")}</Label>
                <Select
                  value={String(minAgeDays)}
                  onValueChange={(v) => {
                    setMinAgeDays(Number(v) as ReminderMinAgeDays);
                    markDirty();
                  }}
                  disabled={!enabled}
                >
                  <HoverHint
                    label={`${t("minAgeLabel")} — ${t("minAgeHint")}`}
                    side="top"
                    fullWidth
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </HoverHint>
                  <SelectContent>
                    {minAgeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("minAgeHint")}
                </p>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="notify-owe">{t("notifyWhenIOwe")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("notifyWhenIOweHint")}
                    </p>
                  </div>
                  <HoverHint
                    label={`${t("notifyWhenIOwe")} — ${t("notifyWhenIOweHint")}`}
                    side="left"
                  >
                    <input
                      id="notify-owe"
                      type="checkbox"
                      className="h-5 w-5 rounded border"
                      checked={notifyWhenIOwe}
                      onChange={(e) => {
                        setNotifyWhenIOwe(e.target.checked);
                        markDirty();
                      }}
                      disabled={!enabled}
                    />
                  </HoverHint>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="notify-owed">{t("notifyWhenOwed")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("notifyWhenOwedHint")}
                    </p>
                  </div>
                  <HoverHint
                    label={`${t("notifyWhenOwed")} — ${t("notifyWhenOwedHint")}`}
                    side="left"
                  >
                    <input
                      id="notify-owed"
                      type="checkbox"
                      className="h-5 w-5 rounded border"
                      checked={notifyWhenOwedToMe}
                      onChange={(e) => {
                        setNotifyWhenOwedToMe(e.target.checked);
                        markDirty();
                      }}
                      disabled={!enabled}
                    />
                  </HoverHint>
                </div>
              </div>

              {settings?.lastSentAt && (
                <p className="text-xs text-muted-foreground">
                  {t("lastSent", {
                    datetime: new Date(settings.lastSentAt).toLocaleString(
                      dateTimeLocale
                    ),
                  })}
                </p>
              )}

              <Button
                onClick={handleSave}
                disabled={!dirty || updateSettings.isLoading}
              >
                {updateSettings.isLoading ? tShared("saving") : tShared("save")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
