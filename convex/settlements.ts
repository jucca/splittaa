import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./_lib/auth";
import { assertGroupMember, assertGroupMembers } from "./_lib/authorize";
import {
  applySettlementToBalances,
  getNetBalanceBetweenUsers,
} from "./_lib/balances";

/* ============================================================================
 *  MUTATION: createSettlement
 * -------------------------------------------------------------------------- */

export const createSettlement = mutation({
  args: {
    amount: v.number(), // must be > 0
    note: v.optional(v.string()),
    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),
    groupId: v.optional(v.id("groups")), // null when settling one‑to‑one
    relatedExpenseIds: v.optional(v.array(v.id("expenses"))),
  },
  handler: async (ctx, args) => {
    // Use centralized getCurrentUser function
    const caller = await requireAuth(ctx);

    /* ── basic validation ────────────────────────────────────────────────── */
    if (args.amount <= 0) throw new Error("Summan on oltava positiivinen");
    if (args.paidByUserId === args.receivedByUserId) {
      throw new Error("Maksaja ja vastaanottaja eivät voi olla sama henkilö");
    }
    if (
      caller._id !== args.paidByUserId &&
      caller._id !== args.receivedByUserId
    ) {
      throw new Error("Sinun on oltava joko maksaja tai vastaanottaja");
    }

    /* ── group check (if provided) ───────────────────────────────────────── */
    if (args.groupId) {
      await assertGroupMembers(ctx, args.groupId, [
        args.paidByUserId,
        args.receivedByUserId,
      ]);
    }

    /* ── insert ──────────────────────────────────────────────────────────── */
    const settlementId = await ctx.db.insert("settlements", {
      amount: args.amount,
      note: args.note,
      date: Date.now(), // server‑side timestamp
      paidByUserId: args.paidByUserId,
      receivedByUserId: args.receivedByUserId,
      groupId: args.groupId,
      relatedExpenseIds: args.relatedExpenseIds,
      createdBy: caller._id,
    });

    await applySettlementToBalances(
      ctx,
      {
        paidByUserId: args.paidByUserId,
        receivedByUserId: args.receivedByUserId,
        amount: args.amount,
        groupId: args.groupId,
      },
      1
    );

    return settlementId;
  },
});

/* ============================================================================
 *  QUERY: getSettlementData
 *  Returns the balances relevant for a page routed as:
 *      /settlements/[entityType]/[entityId]
 *  where entityType ∈ {"user","group"}
 * -------------------------------------------------------------------------- */

export const getSettlementData = query({
  args: {
    entityType: v.string(), // "user"  | "group"
    entityId: v.string(), // Convex _id (string form) of the user or group
  },
  handler: async (ctx, args) => {
    // Use centralized getCurrentUser function
    const me = await requireAuth(ctx);

    if (args.entityType === "user") {
      /* ─────────────────────────────────────────────── user page */
      const other = await ctx.db.get(args.entityId as Id<"users">);
      if (!other) throw new Error("Käyttäjää ei löytynyt");

      const netBalance = await getNetBalanceBetweenUsers(ctx, me._id, other._id);
      const owed = netBalance > 0 ? netBalance : 0;
      const owing = netBalance < 0 ? Math.abs(netBalance) : 0;

      return {
        type: "user",
        counterpart: {
          userId: other._id,
          name: other.name,
          email: other.email,
          imageUrl: other.imageUrl,
        },
        youAreOwed: owed,
        youOwe: owing,
        netBalance, // + => you should receive, − => you should pay
      };
    } else if (args.entityType === "group") {
      /* ──────────────────────────────────────────────────────── group page */
      const group = await assertGroupMember(
        ctx,
        args.entityId as Id<"groups">,
        me._id
      );

      const list = await Promise.all(
        group.members
          .map((m) => m.userId)
          .filter((userId) => userId !== me._id)
          .map(async (uid) => {
            const canonical =
              me._id < uid
                ? { userId: me._id, counterpartyUserId: uid, isMeCanonical: true }
                : {
                    userId: uid,
                    counterpartyUserId: me._id,
                    isMeCanonical: false,
                  };
            const rows = await ctx.db
              .query("balances")
              .withIndex("by_scope_pair", (q) =>
                q
                  .eq("scopeType", "group")
                  .eq("scopeGroupId", group._id)
                  .eq("userId", canonical.userId)
                  .eq("counterpartyUserId", canonical.counterpartyUserId)
              )
              .collect();
            const pairAmount = rows[0]?.amount ?? 0;
            const netBalance = canonical.isMeCanonical ? -pairAmount : pairAmount;
            const m = await ctx.db.get(uid);
            const owed = netBalance > 0 ? netBalance : 0;
            const owing = netBalance < 0 ? Math.abs(netBalance) : 0;

            return {
              userId: uid,
              name: m?.name || "Tuntematon",
              imageUrl: m?.imageUrl,
              youAreOwed: owed,
              youOwe: owing,
              netBalance,
            };
          })
      );

      return {
        type: "group",
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
        },
        balances: list,
      };
    }

    /* ── unsupported entityType ──────────────────────────────────────────── */
    throw new Error("Virheellinen entityType; odotettiin 'user' tai 'group'");
  },
});