import { describe, expect, it } from "vitest";
import {
  DEFAULT_REMINDER_SETTINGS,
  filterDebtsByMinAge,
  normalizeReminderSettings,
  shouldSendReminderNow,
} from "../../convex/_lib/reminderSettings";

describe("reminderSettings", () => {
  it("applies defaults when settings missing", () => {
    expect(normalizeReminderSettings(undefined)).toEqual(
      DEFAULT_REMINDER_SETTINGS
    );
  });

  it("respects reminder interval", () => {
    const now = Date.now();
    const weekAgo = now - 8 * 24 * 60 * 60 * 1000;
    expect(
      shouldSendReminderNow(
        { ...DEFAULT_REMINDER_SETTINGS, lastSentAt: weekAgo },
        now
      )
    ).toBe(true);
    expect(
      shouldSendReminderNow(
        { ...DEFAULT_REMINDER_SETTINGS, lastSentAt: now - 2 * 24 * 60 * 60 * 1000 },
        now
      )
    ).toBe(false);
  });

  it("filters debts by minimum age", () => {
    const now = Date.now();
    const old = { amount: 10, since: now - 10 * 24 * 60 * 60 * 1000 };
    const fresh = { amount: 5, since: now - 1 * 24 * 60 * 60 * 1000 };
    const result = filterDebtsByMinAge([old, fresh], 7, now);
    expect(result).toHaveLength(1);
    expect(result[0]?.amount).toBe(10);
  });
});
