"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

const INTERVAL_OPTIONS: { value: ReminderIntervalDays; label: string }[] = [
  { value: 3, label: "3 päivää" },
  { value: 7, label: "7 päivää" },
  { value: 14, label: "14 päivää" },
  { value: 30, label: "30 päivää" },
];

const MIN_AGE_OPTIONS: { value: ReminderMinAgeDays; label: string }[] = [
  { value: 3, label: "3 päivää" },
  { value: 7, label: "7 päivää" },
  { value: 14, label: "14 päivää" },
  { value: 30, label: "30 päivää" },
];

export default function SettingsPage() {
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
      toast.error("Valitse vähintään yksi muistutustyyppi");
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
      toast.success("Asetukset tallennettu");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error("Tallennus epäonnistui: " + message);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-lg space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Takaisin
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-md">
          <Bell className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl gradient-title">Asetukset</h1>
          <p className="text-muted-foreground mt-1">
            Säädä sähköpostimuistutuksia avoimista saldoista.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saldomuistutukset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Ladataan…</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="reminders-enabled">Muistutukset käytössä</Label>
                  <p className="text-sm text-muted-foreground">
                    Lähetämme sähköpostia vain valituin välein, jos saldo on
                    edelleen auki.
                  </p>
                </div>
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
              </div>

              <div className="space-y-2">
                <Label>Muistuta minua</Label>
                <Select
                  value={String(intervalDays)}
                  onValueChange={(v) => {
                    setIntervalDays(Number(v) as ReminderIntervalDays);
                    markDirty();
                  }}
                  disabled={!enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Velan on oltava avoinna vähintään</Label>
                <Select
                  value={String(minAgeDays)}
                  onValueChange={(v) => {
                    setMinAgeDays(Number(v) as ReminderMinAgeDays);
                    markDirty();
                  }}
                  disabled={!enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MIN_AGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Lyhytaikaisia saldoja ei muistuteta — vain pitkään avoinna
                  olleet.
                </p>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="notify-owe">Kun olen velkaa jollekulle</Label>
                    <p className="text-sm text-muted-foreground">
                      Muistutus omista maksamattomista veloista.
                    </p>
                  </div>
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
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="notify-owed">
                      Kun joku on velkaa minulle
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Muistutus saatavistasi (esim. muistuta kaveria).
                    </p>
                  </div>
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
                </div>
              </div>

              {settings?.lastSentAt && (
                <p className="text-xs text-muted-foreground">
                  Viimeisin muistutus lähetetty:{" "}
                  {new Date(settings.lastSentAt).toLocaleString("fi-FI")}
                </p>
              )}

              <Button
                onClick={handleSave}
                disabled={!dirty || updateSettings.isLoading}
              >
                {updateSettings.isLoading ? "Tallennetaan…" : "Tallenna"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
