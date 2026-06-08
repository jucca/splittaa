import { convexTest } from "convex-test";
import { expect } from "vitest";
import { api } from "../../convex/_generated/api";
import { convexModules, schema } from "./setup";

export function createTestConvex() {
  return convexTest(schema, convexModules);
}

export type TestContext = ReturnType<typeof createTestConvex>;

export async function createTestUser(
  t: TestContext,
  label: string
): Promise<{
  asUser: TestContext;
  userId: Awaited<ReturnType<TestContext["mutation"]>>;
  tokenIdentifier: string;
}> {
  const tokenIdentifier = `test|${label}`;
  const asUser = t.withIdentity({
    tokenIdentifier,
    subject: tokenIdentifier,
    name: `User ${label}`,
    email: `${label}@test.example`,
  });
  const userId = await asUser.mutation(api.users.store, {});
  return { asUser, userId, tokenIdentifier };
}

export async function completeTestProfile(
  asUser: TestContext,
  label: string
): Promise<void> {
  const username = label.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20);
  await asUser.mutation(api.users.completeProfile, {
    displayName: `User ${label}`,
    username: username.length >= 3 ? username : `${username}x`.slice(0, 20),
  });
}

export function expectConvexError(
  error: unknown,
  code: string
): void {
  expect(error).toBeInstanceOf(Error);
  const data = (error as { data?: { code?: string } }).data;
  expect(data?.code).toBe(code);
}

export async function getDirectInviteToken(
  t: TestContext,
  groupId: Awaited<ReturnType<TestContext["mutation"]>>,
  userId: Awaited<ReturnType<TestContext["mutation"]>>
): Promise<string | null> {
  return await t.run(async (ctx) => {
    const invites = await ctx.db
      .query("groupInvites")
      .withIndex("by_group_and_status", (q) =>
        q.eq("groupId", groupId).eq("status", "pending")
      )
      .collect();
    const direct = invites.find(
      (i) => i.kind === "direct" && i.invitedUserId === userId
    );
    return direct?.token ?? null;
  });
}

export async function joinGroupAsUser(
  t: TestContext,
  asUser: TestContext,
  groupId: Awaited<ReturnType<TestContext["mutation"]>>,
  userId: Awaited<ReturnType<TestContext["mutation"]>>
): Promise<void> {
  const token = await getDirectInviteToken(t, groupId, userId);
  if (!token) {
    throw new Error("No direct invite token found for user");
  }
  await asUser.mutation(api.groupInvites.acceptInvite, { token });
}
