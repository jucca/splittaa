import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./_lib/auth";
import { assertGroupMember } from "./_lib/authorize";
import { normalizeBalanceSettings } from "./_lib/balanceSettings";
import { computeGlobalBalanceByCounterparty } from "./_lib/globalBalance";
import { viewerCurrency } from "./_lib/moneyDisplay";

export const getPersonalBalances = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireAuth(ctx);
    const viewerCur = viewerCurrency(me);
    const { autoNetBalances } = normalizeBalanceSettings(
      me.balanceSettings ?? undefined
    );
    const owedLedger = await computeGlobalBalanceByCounterparty(
      ctx,
      me._id,
      viewerCur,
      autoNetBalances
    );

    return [...owedLedger.entries()].map(([userId, owed]) => ({
      userId,
      netBalance: -owed,
    }));
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

