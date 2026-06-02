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
