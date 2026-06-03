import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./_lib/auth";
import { assertGroupMember } from "./_lib/authorize";

export const getGroupOrMembers = query({
  args: {
    groupId: v.optional(v.id("groups")), // Optional - if provided, will return details for just this group
  },
  handler: async (ctx, args) => {
    // Use centralized getCurrentUser function
    const currentUser = await requireAuth(ctx);

    // Get all groups where the user is a member
    const allGroups = await ctx.db.query("groups").collect();
    const userGroups = allGroups.filter((group) =>
      group.members.some((member) => member.userId === currentUser._id)
    );

    // If a specific group ID is provided, only return details for that group
    if (args.groupId) {
      const selectedGroup = await assertGroupMember(
        ctx,
        args.groupId,
        currentUser._id
      );

      // Get all user details for this group's members
      const memberDetails = await Promise.all(
        selectedGroup.members.map(async (member) => {
          const user = await ctx.db.get(member.userId);
          if (!user) return null;

          return {
            id: user._id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            role: member.role,
          };
        })
      );

      // Filter out any null values (in case a user was deleted)
      const validMembers = memberDetails.filter((member) => member !== null);

      // Return selected group with member details
      return {
        selectedGroup: {
          id: selectedGroup._id,
          name: selectedGroup.name,
          description: selectedGroup.description,
          createdBy: selectedGroup.createdBy,
          members: validMembers,
        },
        groups: userGroups.map((group) => ({
          id: group._id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length,
        })),
      };
    }

    return {
      selectedGroup: null,
      groups: userGroups.map((group) => ({
        id: group._id,
        name: group.name,
        description: group.description,
        memberCount: group.members.length,
      })),
    };
  },
});

// Get expenses for a specific group
export const getGroupExpenses = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    // Use centralized getCurrentUser function
    const currentUser = await requireAuth(ctx);

    const group = await assertGroupMember(ctx, groupId, currentUser._id);

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    /* ----------  member map ---------- */
    const memberDetails = (
      await Promise.all(
        group.members.map(async (m) => {
          const u = await ctx.db.get(m.userId);
          if (!u) return null;
          return { id: u._id, name: u.name, imageUrl: u.imageUrl, role: m.role };
        })
      )
    ).filter((m): m is NonNullable<typeof m> => m !== null);
    const ids = memberDetails.map((m) => m.id);

    /* ----------  ledgers from snapshot table ---------- */
    const totals = Object.fromEntries(ids.map((id) => [id, 0])) as Record<
      Id<"users">,
      number
    >;
    const ledger = {} as Record<Id<"users">, Record<Id<"users">, number>>;
    ids.forEach((a) => {
      ledger[a] = {};
      ids.forEach((b) => {
        if (a !== b) ledger[a][b] = 0;
      });
    });

    const snapshotRows = await ctx.db
      .query("balances")
      .withIndex("by_scope", (q) =>
        q.eq("scopeType", "group").eq("scopeGroupId", groupId)
      )
      .collect();

    for (const row of snapshotRows) {
      if (!ids.includes(row.userId) || !ids.includes(row.counterpartyUserId)) {
        continue;
      }
      if (row.amount <= 0) continue;
      // Canonical row stores "row.userId owes row.counterpartyUserId".
      ledger[row.userId][row.counterpartyUserId] = row.amount;
      totals[row.userId] -= row.amount;
      totals[row.counterpartyUserId] += row.amount;
    }

    /* ----------  shape the response ---------- */
    const balances = memberDetails.map((m) => ({
      ...m,
      totalBalance: totals[m.id],
      owes: Object.entries(ledger[m.id])
        .filter(([, v]) => v > 0)
        .map(([to, amount]) => ({ to, amount })),
      owedBy: ids
        .filter((other) => ledger[other][m.id] > 0)
        .map((other) => ({ from: other, amount: ledger[other][m.id] })),
    }));

    const userLookupMap: Record<
      Id<"users">,
      (typeof memberDetails)[number]
    > = {};
    memberDetails.forEach((member) => {
      userLookupMap[member.id] = member;
    });

    const currentMember = group.members.find((m) => m.userId === currentUser._id);

    return {
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
      },
      members: memberDetails,
      expenses,
      settlements,
      balances,
      userLookupMap,
      isAdmin: currentMember?.role === "admin",
    };
  },
});
