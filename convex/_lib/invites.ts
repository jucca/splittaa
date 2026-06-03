import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const DISPLAY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newInviteToken(): string {
  return crypto.randomUUID();
}

export function newDisplayCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    const idx = Math.floor(Math.random() * DISPLAY_CODE_ALPHABET.length);
    code += DISPLAY_CODE_ALPHABET[idx];
  }
  return code;
}

export function inviteExpiresAt(createdAt: number): number {
  return createdAt + INVITE_TTL_MS;
}

export function isInviteExpired(invite: Doc<"groupInvites">, now = Date.now()): boolean {
  return invite.expiresAt <= now;
}

export function isGroupAdmin(group: Doc<"groups">, userId: Id<"users">): boolean {
  const member = group.members.find((m) => m.userId === userId);
  return member?.role === "admin";
}

export function isGroupMember(group: Doc<"groups">, userId: Id<"users">): boolean {
  return group.members.some((m) => m.userId === userId);
}

export async function findInviteByToken(ctx: Ctx, token: string) {
  return await ctx.db
    .query("groupInvites")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
}

export async function findOpenInviteByDisplayCode(ctx: Ctx, displayCode: string) {
  const normalized = displayCode.trim().toUpperCase();
  return await ctx.db
    .query("groupInvites")
    .withIndex("by_display_code", (q) => q.eq("displayCode", normalized))
    .unique();
}

export async function ensureInviteActive(
  ctx: MutationCtx,
  invite: Doc<"groupInvites">
): Promise<Doc<"groupInvites">> {
  if (invite.status !== "pending") {
    throw new ConvexError({
      code: "INVALID_STATE",
      message: "Kutsu ei ole enää voimassa",
    });
  }
  if (isInviteExpired(invite)) {
    await ctx.db.patch(invite._id, { status: "expired" });
    throw new ConvexError({
      code: "EXPIRED",
      message: "Kutsu on vanhentunut",
    });
  }
  return invite;
}

export async function addGroupMember(
  ctx: MutationCtx,
  group: Doc<"groups">,
  userId: Id<"users">,
  role: "admin" | "member" = "member"
): Promise<void> {
  if (isGroupMember(group, userId)) {
    return;
  }
  await ctx.db.patch(group._id, {
    members: [
      ...group.members,
      { userId, role, joinedAt: Date.now() },
    ],
  });
}

export function getSiteUrlFromEnv(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel}`;
  }
  return "http://localhost:3000";
}
