export const REMINDER_INTERVAL_OPTIONS = [3, 7, 14, 30] as const;
export const REMINDER_MIN_AGE_OPTIONS = [3, 7, 14, 30] as const;

export type ReminderIntervalDays = (typeof REMINDER_INTERVAL_OPTIONS)[number];
export type ReminderMinAgeDays = (typeof REMINDER_MIN_AGE_OPTIONS)[number];
