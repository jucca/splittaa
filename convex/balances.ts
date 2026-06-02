import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./_lib/auth";
import { assertGroupMember } from "./_lib/authorize";

function toNetFromCanonical(
  meId: Id<"users">,
  userId: Id<"users">,
  counterpartyUserId: Id<"users">,
  amount: number
) {
  if (meId === userId) return -amount;
  if (meId === counterpartyUserId) return amount;
  return 0;
}

export const getPersonalBalances = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireAuth(ctx);
    const rows = await ctx.db
      .query("balances")
      .withIndex("by_user_scope", (q) =>
        q.eq("userId", me._id).eq("scopeType", "personal").eq("scopeGroupId", undefined)
      )
      .collect();

    const counterpartRows = await ctx.db
      .query("balances")
      .withIndex("by_scope", (q) =>
        q.eq("scopeType", "personal").eq("scopeGroupId", undefined)
      )
      .collect();

    const merged = new Map<string, { userId: Id<"users">; netBalance: number }>();
    for (const row of [...rows, ...counterpartRows]) {
      if (row.userId !== me._id && row.counterpartyUserId !== me._id) continue;
      const otherUserId =
        row.userId === me._id ? row.counterpartyUserId : row.userId;
      const net = toNetFromCanonical(
        me._id,
        row.userId,
        row.counterpartyUserId,
        row.amount
      );
      merged.set(otherUserId, { userId: otherUserId, netBalance: net });
    }

    return Array.from(merged.values());
  },
});

export const getGroupBalances = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const me = await requireAuth(ctx);
    const group = await assertGroupMember(ctx, groupId, me._id);

    const rows = await ctx.db
      .query("balances")
      .withIndex("by_scope", (q) =>
        q.eq("scopeType", "group").eq("scopeGroupId", groupId)
      )
      .collect();

    const balancesByUser = new Map<Id<"users">, number>();
    for (const row of rows) {
      balancesByUser.set(
        row.userId,
        (balancesByUser.get(row.userId) ?? 0) - row.amount
      );
      balancesByUser.set(
        row.counterpartyUserId,
        (balancesByUser.get(row.counterpartyUserId) ?? 0) + row.amount
      );
    }

    const members = await Promise.all(
      group.members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          userId: member.userId,
          name: user?.name ?? "Tuntematon",
          imageUrl: user?.imageUrl,
          netBalance: balancesByUser.get(member.userId) ?? 0,
        };
      })
    );

    return {
      group: { id: group._id, name: group.name, description: group.description },
      balances: members,
    };
  },
});

