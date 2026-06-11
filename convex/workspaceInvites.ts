import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireAuth } from "./_lib/auth";
import {
  getSiteUrlFromEnv,
  inviteExpiresAt,
  newDisplayCode,
  newInviteToken,
} from "./_lib/invites";
import {
  assertWorkspaceMember,
  isWorkspaceAdmin,
  isWorkspaceMember,
} from "./_lib/workspaces";

type Ctx = QueryCtx | MutationCtx;

function isWorkspaceInviteExpired(
  invite: Doc<"workspaceInvites">,
  now = Date.now()
): boolean {
  return invite.expiresAt <= now;
}

async function findWorkspaceInviteByToken(ctx: Ctx, token: string) {
  return await ctx.db
    .query("workspaceInvites")
    .withIndex("by_token", (q) => q.eq("token", token.trim()))
    .unique();
}

async function findOpenWorkspaceInviteByDisplayCode(ctx: Ctx, displayCode: string) {
  const normalized = displayCode.trim().toUpperCase();
  return await ctx.db
    .query("workspaceInvites")
    .withIndex("by_display_code", (q) => q.eq("displayCode", normalized))
    .unique();
}

async function addWorkspaceMember(
  ctx: MutationCtx,
  workspace: Doc<"workspaces">,
  userId: Doc<"users">["_id"],
  role: "admin" | "member" = "member"
) {
  if (isWorkspaceMember(workspace, userId)) return workspace;
  await ctx.db.patch(workspace._id, {
    members: [
      ...workspace.members,
      { userId, role, joinedAt: Date.now() },
    ],
  });
  return workspace;
}

async function ensureWorkspaceInviteActive(
  ctx: MutationCtx,
  invite: Doc<"workspaceInvites">
): Promise<Doc<"workspaceInvites">> {
  if (invite.status !== "pending") {
    throw new ConvexError({
      code: "INVALID_STATE",
      message: "Kutsu ei ole enää voimassa",
    });
  }
  if (isWorkspaceInviteExpired(invite)) {
    await ctx.db.patch(invite._id, { status: "expired" });
    throw new ConvexError({
      code: "EXPIRED",
      message: "Kutsu on vanhentunut",
    });
  }
  return invite;
}

export const joinByDisplayCode = mutation({
  args: { displayCode: v.string() },
  handler: async (ctx, { displayCode }) => {
    const user = await requireAuth(ctx);
    const invite = await findOpenWorkspaceInviteByDisplayCode(ctx, displayCode);
    if (!invite) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Koodilla ei löytynyt työpöytäkutsua",
      });
    }

    const active = await ensureWorkspaceInviteActive(ctx, invite);
    const workspace = await ctx.db.get(active.workspaceId);
    if (!workspace) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Työpöytää ei löytynyt",
      });
    }

    if (isWorkspaceMember(workspace, user._id)) {
      return { workspaceId: workspace._id, alreadyMember: true };
    }

    await addWorkspaceMember(ctx, workspace, user._id);
    return { workspaceId: workspace._id, alreadyMember: false };
  },
});

export const getOpenInviteForWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const user = await requireAuth(ctx);
    const workspace = await assertWorkspaceMember(ctx, workspaceId, user._id);
    if (!isWorkspaceAdmin(workspace, user._id)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vain ylläpitäjä voi hallita kutsuja",
      });
    }

    const openInvite = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_workspace_and_status", (q) =>
        q.eq("workspaceId", workspaceId).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("kind"), "open"))
      .first();

    if (!openInvite || isWorkspaceInviteExpired(openInvite)) {
      return null;
    }

    const siteUrl = getSiteUrlFromEnv();
    return {
      token: openInvite.token,
      displayCode: openInvite.displayCode ?? "",
      joinUrl: `${siteUrl}/join-workspace/${openInvite.token}`,
    };
  },
});

export const ensureOpenInvite = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const user = await requireAuth(ctx);
    const workspace = await assertWorkspaceMember(ctx, workspaceId, user._id);
    if (!isWorkspaceAdmin(workspace, user._id)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vain ylläpitäjä voi luoda kutsuja",
      });
    }

    const existing = await ctx.db
      .query("workspaceInvites")
      .withIndex("by_workspace_and_status", (q) =>
        q.eq("workspaceId", workspaceId).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("kind"), "open"))
      .first();

    if (existing && !isWorkspaceInviteExpired(existing)) {
      const siteUrl = getSiteUrlFromEnv();
      return {
        token: existing.token,
        displayCode: existing.displayCode ?? "",
        joinUrl: `${siteUrl}/join-workspace/${existing.token}`,
      };
    }

    const now = Date.now();
    const token = newInviteToken();
    const displayCode = newDisplayCode();
    await ctx.db.insert("workspaceInvites", {
      workspaceId,
      invitedBy: user._id,
      token,
      displayCode,
      kind: "open",
      status: "pending",
      expiresAt: inviteExpiresAt(now),
      createdAt: now,
    });

    const siteUrl = getSiteUrlFromEnv();
    return {
      token,
      displayCode,
      joinUrl: `${siteUrl}/join-workspace/${token}`,
    };
  },
});

export const acceptInviteByToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await requireAuth(ctx);
    const invite = await findWorkspaceInviteByToken(ctx, token);
    if (!invite) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Kutsua ei löytynyt",
      });
    }

    const active = await ensureWorkspaceInviteActive(ctx, invite);
    const workspace = await ctx.db.get(active.workspaceId);
    if (!workspace) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Työpöytää ei löytynyt",
      });
    }

    if (isWorkspaceMember(workspace, user._id)) {
      return { workspaceId: workspace._id };
    }

    await addWorkspaceMember(ctx, workspace, user._id);
    if (active.kind === "direct") {
      await ctx.db.patch(active._id, { status: "accepted" });
    }
    return { workspaceId: workspace._id };
  },
});
