import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAuth } from "./_lib/auth";
import {
  addGroupMember,
  ensureInviteActive,
  findInviteByToken,
  findOpenInviteByDisplayCode,
  getSiteUrlFromEnv,
  inviteExpiresAt,
  isGroupAdmin,
  isGroupMember,
  isInviteExpired,
  newDisplayCode,
  newInviteToken,
} from "./_lib/invites";
import { internal } from "./_generated/api";
import {
  deliverGroupInviteNotification,
  markInviteNotificationsRead,
} from "./_lib/notifications";

async function loadInvitePreview(
  ctx: QueryCtx,
  invite: Doc<"groupInvites">
) {
  const group = await ctx.db.get(invite.groupId);
  if (!group) return null;
  const inviter = await ctx.db.get(invite.invitedBy);
  const expired = isInviteExpired(invite);
  return {
    groupName: group.name,
    groupDescription: group.description ?? "",
    inviterName: inviter?.name ?? "Tuntematon",
    memberCount: group.members.length,
    kind: invite.kind,
    status: expired ? ("expired" as const) : invite.status,
    expired,
  };
}

/** Public: safe preview for join page (documented in docs/SECURITY.md). */
export const getInvitePreview = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invite = await findInviteByToken(ctx, token.trim());
    if (!invite) {
      return null;
    }
    return loadInvitePreview(ctx, invite);
  },
});

export const listMyPendingInvites = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await requireAuth(ctx);
    const invites = await ctx.db
      .query("groupInvites")
      .withIndex("by_invited_user_and_status", (q) =>
        q.eq("invitedUserId", currentUser._id).eq("status", "pending")
      )
      .collect();

    const now = Date.now();
    const results = [];
    for (const invite of invites) {
      if (invite.kind !== "direct" || isInviteExpired(invite, now)) {
        continue;
      }
      const group = await ctx.db.get(invite.groupId);
      const inviter = await ctx.db.get(invite.invitedBy);
      if (!group) continue;
      results.push({
        inviteId: invite._id,
        token: invite.token,
        groupId: group._id,
        groupName: group.name,
        inviterName: inviter?.name ?? "Tuntematon",
        expiresAt: invite.expiresAt,
      });
    }
    return results;
  },
});

export const getOpenInviteForGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const currentUser = await requireAuth(ctx);
    const group = await ctx.db.get(groupId);
    if (!group) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Ryhmää ei löytynyt" });
    }
    if (!isGroupMember(group, currentUser._id)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Et ole tämän ryhmän jäsen",
      });
    }

    const openInvite = await ctx.db
      .query("groupInvites")
      .withIndex("by_group_and_status", (q) =>
        q.eq("groupId", groupId).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("kind"), "open"))
      .first();

    if (!openInvite || isInviteExpired(openInvite)) {
      return null;
    }

    const siteUrl = getSiteUrlFromEnv();
    return {
      token: openInvite.token,
      displayCode: openInvite.displayCode ?? "",
      joinUrl: `${siteUrl}/join/${openInvite.token}`,
      expiresAt: openInvite.expiresAt,
    };
  },
});

export const listGroupInvites = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const currentUser = await requireAuth(ctx);
    const group = await ctx.db.get(groupId);
    if (!group) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Ryhmää ei löytynyt" });
    }
    if (!isGroupAdmin(group, currentUser._id)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vain ryhmän ylläpitäjä voi tarkastella kutsuja",
      });
    }

    const invites = await ctx.db
      .query("groupInvites")
      .withIndex("by_group_and_status", (q) => q.eq("groupId", groupId))
      .collect();

    const now = Date.now();
    const pending = invites.filter(
      (i) => i.status === "pending" && !isInviteExpired(i, now)
    );

    const enriched = await Promise.all(
      pending.map(async (invite) => {
        let invitedUserName: string | null = null;
        if (invite.invitedUserId) {
          const u = await ctx.db.get(invite.invitedUserId);
          invitedUserName = u?.name ?? null;
        }
        return {
          inviteId: invite._id,
          kind: invite.kind,
          token: invite.token,
          displayCode: invite.displayCode ?? null,
          invitedUserId: invite.invitedUserId ?? null,
          invitedUserName,
          expiresAt: invite.expiresAt,
          createdAt: invite.createdAt,
        };
      })
    );

    return enriched;
  },
});

export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const currentUser = await requireAuth(ctx);
    const invite = await findInviteByToken(ctx, token.trim());
    if (!invite) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Kutsua ei löytynyt" });
    }

    await ensureInviteActive(ctx, invite);

    if (invite.kind === "direct") {
      if (invite.invitedUserId !== currentUser._id) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Tämä kutsu on tarkoitettu toiselle käyttäjälle",
        });
      }
    }

    const group = await ctx.db.get(invite.groupId);
    if (!group) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Ryhmää ei löytynyt" });
    }

    if (isGroupMember(group, currentUser._id)) {
      if (invite.kind === "direct") {
        await ctx.db.patch(invite._id, { status: "accepted" });
        await markInviteNotificationsRead(ctx, invite._id);
      }
      return { groupId: group._id, alreadyMember: true };
    }

    await addGroupMember(ctx, group, currentUser._id, "member");

    if (invite.kind === "direct") {
      await ctx.db.patch(invite._id, { status: "accepted" });
      await markInviteNotificationsRead(ctx, invite._id);
    }

    return { groupId: group._id, alreadyMember: false };
  },
});

export const declineInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const currentUser = await requireAuth(ctx);
    const invite = await findInviteByToken(ctx, token.trim());
    if (!invite) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Kutsua ei löytynyt" });
    }

    if (invite.kind !== "direct") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Avointa kutsua ei voi hylätä",
      });
    }

    await ensureInviteActive(ctx, invite);

    if (invite.invitedUserId !== currentUser._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Voit hylätä vain omat kutsusi",
      });
    }

    await ctx.db.patch(invite._id, { status: "declined" });
    await markInviteNotificationsRead(ctx, invite._id);
    return { success: true as const };
  },
});

export const joinByCode = mutation({
  args: { displayCode: v.string() },
  handler: async (ctx, { displayCode }) => {
    const currentUser = await requireAuth(ctx);
    const invite = await findOpenInviteByDisplayCode(ctx, displayCode);
    if (!invite || invite.kind !== "open") {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Liittymiskoodia ei löytynyt",
      });
    }

    await ensureInviteActive(ctx, invite);

    const group = await ctx.db.get(invite.groupId);
    if (!group) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Ryhmää ei löytynyt" });
    }

    if (isGroupMember(group, currentUser._id)) {
      return { groupId: group._id, alreadyMember: true };
    }

    await addGroupMember(ctx, group, currentUser._id, "member");
    return { groupId: group._id, alreadyMember: false };
  },
});

export const revokeInvite = mutation({
  args: { inviteId: v.id("groupInvites") },
  handler: async (ctx, { inviteId }) => {
    const currentUser = await requireAuth(ctx);
    const invite = await ctx.db.get(inviteId);
    if (!invite) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Kutsua ei löytynyt" });
    }

    const group = await ctx.db.get(invite.groupId);
    if (!group) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Ryhmää ei löytynyt" });
    }

    if (!isGroupAdmin(group, currentUser._id)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vain ryhmän ylläpitäjä voi perua kutsun",
      });
    }

    if (invite.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Kutsu ei ole enää voimassa",
      });
    }

    await ctx.db.patch(inviteId, { status: "revoked" });
    await markInviteNotificationsRead(ctx, inviteId);
    return { success: true as const };
  },
});

/** Called from createGroup — creates direct + open invites for a new group. */
export async function createInvitesForGroup(
  ctx: MutationCtx,
  args: {
    groupId: Id<"groups">;
    invitedBy: Id<"users">;
    memberIds: Id<"users">[];
  }
): Promise<{
  directInvites: Doc<"groupInvites">[];
  openInvite: Doc<"groupInvites">;
}> {
  const createdAt = Date.now();
  const expiresAt = inviteExpiresAt(createdAt);
  const directInvites: Doc<"groupInvites">[] = [];

  for (const userId of args.memberIds) {
    if (userId === args.invitedBy) continue;
    const inviteId = await ctx.db.insert("groupInvites", {
      groupId: args.groupId,
      invitedBy: args.invitedBy,
      invitedUserId: userId,
      token: newInviteToken(),
      kind: "direct",
      status: "pending",
      expiresAt,
      createdAt,
    });
    const doc = await ctx.db.get(inviteId);
    if (doc) directInvites.push(doc);
  }

  let displayCode = newDisplayCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await findOpenInviteByDisplayCode(ctx, displayCode);
    if (!existing) break;
    displayCode = newDisplayCode();
  }

  const openInviteId = await ctx.db.insert("groupInvites", {
    groupId: args.groupId,
    invitedBy: args.invitedBy,
    token: newInviteToken(),
    displayCode,
    kind: "open",
    status: "pending",
    expiresAt,
    createdAt,
  });
  const openInvite = await ctx.db.get(openInviteId);
  if (!openInvite) {
    throw new ConvexError({ code: "INTERNAL", message: "Avointa kutsua ei voitu luoda" });
  }

  const siteUrl = getSiteUrlFromEnv();
  for (const invite of directInvites) {
    const invitedUser = invite.invitedUserId
      ? await ctx.db.get(invite.invitedUserId)
      : null;
    const group = await ctx.db.get(args.groupId);
    const inviter = await ctx.db.get(args.invitedBy);
    if (!invitedUser?.email || !group) continue;

    await ctx.scheduler.runAfter(0, internal.email.sendGroupInviteEmail, {
      to: invitedUser.email,
      recipientName: invitedUser.name,
      inviterName: inviter?.name ?? "Joku",
      groupName: group.name,
      joinUrl: `${siteUrl}/join/${invite.token}`,
    });

    if (invite.invitedUserId) {
      await deliverGroupInviteNotification(ctx, {
        userId: invite.invitedUserId,
        inviteId: invite._id,
        groupName: group.name,
        inviterName: inviter?.name ?? "Joku",
        token: invite.token,
      });
    }
  }

  return { directInvites, openInvite };
}
