// convex/contacts.js
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./_lib/auth";
import { getPersonalExpensesForUser } from "./_lib/personal";
import { createInvitesForGroup } from "./groupInvites";

/* ──────────────────────────────────────────────────────────────────────────
   1. getAllContacts – 1‑to‑1 expense contacts + groups
   ──────────────────────────────────────────────────────────────────────── */
export const getAllContacts = query({
  handler: async (ctx) => {
    // Use the centralized getCurrentUser instead of duplicating auth logic
    const currentUser = await requireAuth(ctx);

    const personalExpenses = await getPersonalExpensesForUser(
      ctx,
      currentUser._id
    );

    /* ── extract unique counterpart IDs ─────────────────────────────────── */
    const contactIds = new Set<Id<"users">>();
    personalExpenses.forEach((exp) => {
      if (exp.paidByUserId !== currentUser._id)
        contactIds.add(exp.paidByUserId);

      exp.splits.forEach((s) => {
        if (s.userId !== currentUser._id) contactIds.add(s.userId);
      });
    });

    /* ── fetch user docs ───────────────────────────────────────────────── */
    const contactUsers = await Promise.all(
      [...contactIds].map(async (id) => {
        const u = await ctx.db.get(id);
        return u
          ? {
              id: u._id,
              name: u.name,
              username: u.username ?? null,
              email: u.email,
              imageUrl: u.imageUrl,
              type: "user",
            }
          : null;
      })
    );

    /* ── groups where current user is a member ─────────────────────────── */
    const userGroups = (await ctx.db.query("groups").collect())
      .filter((g) => g.members.some((m) => m.userId === currentUser._id))
      .map((g) => ({
        id: g._id,
        name: g.name,
        description: g.description,
        memberCount: g.members.length,
        type: "group",
      }));

    const validContactUsers = contactUsers.filter(
      (u): u is NonNullable<typeof u> => u !== null
    );

    /* sort alphabetically */
    validContactUsers.sort((a, b) => a.name.localeCompare(b.name));
    userGroups.sort((a, b) => a.name.localeCompare(b.name));

    return { users: validContactUsers, groups: userGroups };
  },
});

/* ──────────────────────────────────────────────────────────────────────────
   2. createGroup – create a new group
   ──────────────────────────────────────────────────────────────────────── */
export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    members: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Use the centralized getCurrentUser instead of duplicating auth logic
    const currentUser = await requireAuth(ctx);

    if (!args.name.trim()) throw new Error("Ryhmän nimi ei voi olla tyhjä");

    const inviteeIds = [...new Set(args.members)].filter(
      (id) => id !== currentUser._id
    );

    for (const id of inviteeIds) {
      if (!(await ctx.db.get(id)))
        throw new Error(`Käyttäjää tunnuksella ${id} ei löytynyt`);
    }

    const groupId = await ctx.db.insert("groups", {
      name: args.name.trim(),
      description: args.description?.trim() ?? "",
      createdBy: currentUser._id,
      members: [
        {
          userId: currentUser._id,
          role: "admin",
          joinedAt: Date.now(),
        },
      ],
    });

    const { directInvites, openInvite } = await createInvitesForGroup(ctx, {
      groupId,
      invitedBy: currentUser._id,
      memberIds: inviteeIds,
    });

    const siteUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    return {
      groupId,
      openInvite: {
        token: openInvite.token,
        displayCode: openInvite.displayCode ?? "",
        joinUrl: `${siteUrl}/join/${openInvite.token}`,
        expiresAt: openInvite.expiresAt,
      },
      directInviteCount: directInvites.length,
    };
  },
});