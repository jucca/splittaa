import { ConvexError } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

function userId(user: Doc<"users"> | Id<"users">): Id<"users"> {
  return typeof user === "string" ? user : user._id;
}

/**
 * Minimal fixtures for E2E / local QA. Requires ALLOW_DEV_SEED=true in Convex env.
 * Run: npx convex run seedTest:seedTestFixtures
 */
export const seedTestFixtures = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (process.env.ALLOW_DEV_SEED !== "true") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Set ALLOW_DEV_SEED=true in Convex dashboard env to seed test data",
      });
    }

    const now = Date.now();
    const tokenA = "test|e2e-user-a";
    const tokenB = "test|e2e-user-b";

    const userA =
      (await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenA))
        .unique()) ??
      (await ctx.db.insert("users", {
        name: "E2E User A",
        email: "e2e-a@test.example",
        tokenIdentifier: tokenA,
      }));

    const userB =
      (await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenB))
        .unique()) ??
      (await ctx.db.insert("users", {
        name: "E2E User B",
        email: "e2e-b@test.example",
        tokenIdentifier: tokenB,
      }));

    const userAId = userId(userA);
    const userBId = userId(userB);

    const groupId = await ctx.db.insert("groups", {
      name: "E2E Test Group",
      description: "Playwright fixtures",
      createdBy: userAId,
      members: [
        { userId: userAId, role: "admin", joinedAt: now },
        { userId: userBId, role: "member", joinedAt: now },
      ],
    });

    await ctx.db.insert("expenses", {
      description: "E2E shared lunch",
      amount: 40,
      category: "foodDrink",
      date: now,
      paidByUserId: userAId,
      splitType: "equal",
      splits: [
        { userId: userAId, amount: 20, paid: true },
        { userId: userBId, amount: 20, paid: false },
      ],
      groupId: undefined,
      createdBy: userAId,
    });

    return {
      userA: userAId,
      userB: userBId,
      groupId,
    };
  },
});
