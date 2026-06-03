import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { createTestConvex, createTestUser } from "./helpers";

describe("settings", () => {
  const t = createTestConvex();

  it("returns default reminder settings for new user", async () => {
    const { asUser } = await createTestUser(t, "settings-default");
    const settings = await asUser.query(api.settings.getReminderSettings);
    expect(settings.enabled).toBe(true);
    expect(settings.intervalDays).toBe(7);
    expect(settings.minAgeDays).toBe(7);
  });

  it("persists reminder settings updates", async () => {
    const { asUser } = await createTestUser(t, "settings-save");
    await asUser.mutation(api.settings.updateReminderSettings, {
      enabled: false,
      intervalDays: 14,
      minAgeDays: 30,
      notifyWhenIOwe: true,
      notifyWhenOwedToMe: false,
    });
    const settings = await asUser.query(api.settings.getReminderSettings);
    expect(settings.enabled).toBe(false);
    expect(settings.intervalDays).toBe(14);
    expect(settings.notifyWhenOwedToMe).toBe(false);
  });
});
