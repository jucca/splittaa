import { v } from "convex/values";
import {
  REMINDER_INTERVAL_OPTIONS,
  REMINDER_MIN_AGE_OPTIONS,
  type ReminderIntervalDays,
  type ReminderMinAgeDays,
} from "../../lib/reminder-settings";

export type { ReminderIntervalDays, ReminderMinAgeDays };
export { REMINDER_INTERVAL_OPTIONS, REMINDER_MIN_AGE_OPTIONS };

export type ReminderSettings = {
  enabled: boolean;
  intervalDays: ReminderIntervalDays;
  minAgeDays: ReminderMinAgeDays;
  notifyWhenIOwe: boolean;
  notifyWhenOwedToMe: boolean;
  lastSentAt?: number;
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  intervalDays: 7,
  minAgeDays: 7,
  notifyWhenIOwe: true,
  notifyWhenOwedToMe: true,
};

export const reminderSettingsValidator = v.object({
  enabled: v.boolean(),
  intervalDays: v.union(
    v.literal(3),
    v.literal(7),
    v.literal(14),
    v.literal(30)
  ),
  minAgeDays: v.union(
    v.literal(3),
    v.literal(7),
    v.literal(14),
    v.literal(30)
  ),
  notifyWhenIOwe: v.boolean(),
  notifyWhenOwedToMe: v.boolean(),
  lastSentAt: v.optional(v.number()),
});

export function normalizeReminderSettings(
  raw: Partial<ReminderSettings> | null | undefined
): ReminderSettings {
  if (!raw) {
    return { ...DEFAULT_REMINDER_SETTINGS };
  }
  return {
    enabled: raw.enabled ?? DEFAULT_REMINDER_SETTINGS.enabled,
    intervalDays: isInterval(raw.intervalDays)
      ? raw.intervalDays
      : DEFAULT_REMINDER_SETTINGS.intervalDays,
    minAgeDays: isMinAge(raw.minAgeDays)
      ? raw.minAgeDays
      : DEFAULT_REMINDER_SETTINGS.minAgeDays,
    notifyWhenIOwe:
      raw.notifyWhenIOwe ?? DEFAULT_REMINDER_SETTINGS.notifyWhenIOwe,
    notifyWhenOwedToMe:
      raw.notifyWhenOwedToMe ?? DEFAULT_REMINDER_SETTINGS.notifyWhenOwedToMe,
    lastSentAt: raw.lastSentAt,
  };
}

function isInterval(n: unknown): n is ReminderIntervalDays {
  return (
    typeof n === "number" &&
    (REMINDER_INTERVAL_OPTIONS as readonly number[]).includes(n)
  );
}

function isMinAge(n: unknown): n is ReminderMinAgeDays {
  return (
    typeof n === "number" &&
    (REMINDER_MIN_AGE_OPTIONS as readonly number[]).includes(n)
  );
}

export function shouldSendReminderNow(
  settings: ReminderSettings,
  now: number
): boolean {
  if (!settings.enabled) return false;
  if (!settings.lastSentAt) return true;
  const intervalMs = settings.intervalDays * 24 * 60 * 60 * 1000;
  return now - settings.lastSentAt >= intervalMs;
}

export function filterDebtsByMinAge<
  T extends { since: number; amount: number },
>(items: T[], minAgeDays: number, now: number): T[] {
  const minAgeMs = minAgeDays * 24 * 60 * 60 * 1000;
  return items.filter((d) => now - d.since >= minAgeMs && d.amount > 0);
}
