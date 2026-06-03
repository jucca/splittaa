import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { assertAutomationSecret } from "./_lib/automation";

export const getUsersWithOutstandingDebts = action({
  args: {
    secret: v.string(),
  },
  handler: async (ctx, args): Promise<unknown> => {
    assertAutomationSecret(args.secret);
    return await ctx.runQuery(
      internal.inngest.getUsersWithOutstandingDebts as Parameters<
        typeof ctx.runQuery
      >[0]
    );
  },
});

export const getUsersWithExpenses = action({
  args: {
    secret: v.string(),
  },
  handler: async (ctx, args): Promise<unknown> => {
    assertAutomationSecret(args.secret);
    return await ctx.runQuery(
      internal.inngest.getUsersWithExpenses as Parameters<
        typeof ctx.runQuery
      >[0]
    );
  },
});

export const getUsersForPaymentReminders = action({
  args: {
    secret: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args): Promise<unknown> => {
    assertAutomationSecret(args.secret);
    return await ctx.runQuery(
      internal.inngest.getUsersForPaymentReminders as Parameters<
        typeof ctx.runQuery
      >[0],
      { now: args.now }
    );
  },
});

export const markReminderSent = action({
  args: {
    secret: v.string(),
    userId: v.id("users"),
    sentAt: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    assertAutomationSecret(args.secret);
    await ctx.runMutation(
      internal.inngest.markReminderSent as Parameters<
        typeof ctx.runMutation
      >[0],
      { userId: args.userId, sentAt: args.sentAt }
    );
  },
});

export const getUserMonthlyExpenses = action({
  args: {
    secret: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<unknown> => {
    assertAutomationSecret(args.secret);
    return await ctx.runQuery(
      internal.inngest.getUserMonthlyExpenses as Parameters<
        typeof ctx.runQuery
      >[0],
      { userId: args.userId }
    );
  },
});
