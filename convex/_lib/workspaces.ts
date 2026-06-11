import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export function isWorkspaceMember(
  workspace: Doc<"workspaces">,
  userId: Id<"users">
): boolean {
  return workspace.members.some((m) => m.userId === userId);
}

export function isWorkspaceAdmin(
  workspace: Doc<"workspaces">,
  userId: Id<"users">
): boolean {
  const member = workspace.members.find((m) => m.userId === userId);
  return member?.role === "admin";
}

export async function assertWorkspaceMember(
  ctx: Ctx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">
): Promise<Doc<"workspaces">> {
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Työpöytää ei löytynyt",
    });
  }
  if (!isWorkspaceMember(workspace, userId)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Et ole tämän työpöydän jäsen",
    });
  }
  return workspace;
}

export async function assertWorkspaceMembers(
  ctx: Ctx,
  workspaceId: Id<"workspaces">,
  userIds: Id<"users">[]
): Promise<Doc<"workspaces">> {
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Työpöytää ei löytynyt",
    });
  }
  for (const userId of userIds) {
    if (!isWorkspaceMember(workspace, userId)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Kaikkien osapuolten on oltava työpöydän jäseniä",
      });
    }
  }
  return workspace;
}

export async function getWorkspacesForUser(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<Doc<"workspaces">[]> {
  const all = await ctx.db.query("workspaces").collect();
  return all.filter((w) => isWorkspaceMember(w, userId));
}

export async function getWorkspaceExpenses(
  ctx: QueryCtx,
  workspaceId: Id<"workspaces">
): Promise<Doc<"expenses">[]> {
  return await ctx.db
    .query("expenses")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .collect();
}
