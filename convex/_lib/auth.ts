import { ConvexError } from "convex/values";
import { internalQuery, type MutationCtx, type QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

export type AuthCtx = QueryCtx | MutationCtx;

export async function requireAuth(ctx: AuthCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Ei tunnistautunut",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      code: "USER_NOT_PROVISIONED",
      message: "Käyttäjää ei löytynyt",
    });
  }

  return user;
}

export const getCurrentUser = internalQuery({
  args: {},
  handler: async (ctx) => requireAuth(ctx),
});
