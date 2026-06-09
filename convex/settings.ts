import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./_lib/auth";
import { normalizeBalanceSettings } from "./_lib/balanceSettings";
import { normalizeReminderSettings } from "./_lib/reminderSettings";

export const getReminderSettings = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return normalizeReminderSettings(user.reminderSettings ?? undefined);
  },
});

export const updateReminderSettings = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const current = normalizeReminderSettings(user.reminderSettings ?? undefined);

    const next = {
      enabled: args.enabled,
      intervalDays: args.intervalDays,
      minAgeDays: args.minAgeDays,
      notifyWhenIOwe: args.notifyWhenIOwe,
      notifyWhenOwedToMe: args.notifyWhenOwedToMe,
      lastSentAt: current.lastSentAt,
    };

    await ctx.db.patch(user._id, { reminderSettings: next });
    return next;
  },
});

export const getBalanceSettings = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return normalizeBalanceSettings(user.balanceSettings ?? undefined);
  },
});

export const updateBalanceSettings = mutation({
  args: {
    autoNetBalances: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const next = { autoNetBalances: args.autoNetBalances };
    await ctx.db.patch(user._id, { balanceSettings: next });
    return next;
  },
});
