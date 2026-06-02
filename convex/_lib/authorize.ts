import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function assertGroupMember(
  ctx: Ctx,
  groupId: Id<"groups">,
  userId: Id<"users">
): Promise<Doc<"groups">> {
  const group = await ctx.db.get(groupId);
  if (!group) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Ryhmää ei löytynyt" });
  }
  if (!group.members.some((m) => m.userId === userId)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Et ole tämän ryhmän jäsen",
    });
  }
  return group;
}

export async function assertGroupMembers(
  ctx: Ctx,
  groupId: Id<"groups">,
  userIds: Id<"users">[]
): Promise<Doc<"groups">> {
  const group = await ctx.db.get(groupId);
  if (!group) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Ryhmää ei löytynyt" });
  }
  for (const userId of userIds) {
    if (!group.members.some((m) => m.userId === userId)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Molempien osapuolten on oltava ryhmän jäseniä",
      });
    }
  }
  return group;
}
