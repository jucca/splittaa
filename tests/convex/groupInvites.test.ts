import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  createTestConvex,
  createTestUser,
  expectConvexError,
  getDirectInviteToken,
  joinGroupAsUser,
} from "./helpers";

describe("groupInvites", () => {
  const t = createTestConvex();

  it("createGroup adds only creator as member and creates invites", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "creator");
    const { userId: userB } = await createTestUser(t, "invitee");

    const result = await asA.mutation(api.contacts.createGroup, {
      name: "Kutsuryhmä",
      members: [userB],
    });

    expect(result.groupId).toBeTruthy();
    expect(result.directInviteCount).toBe(1);
    expect(result.openInvite.displayCode).toHaveLength(8);
    expect(result.openInvite.joinUrl).toContain("/join/");

    const group = await t.run(async (ctx) => ctx.db.get(result.groupId));
    expect(group?.members).toHaveLength(1);
    expect(group?.members[0]?.userId).toBe(userA);
  });

  it("acceptInvite adds direct invitee to group", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "host");
    const { asUser: asB, userId: userB } = await createTestUser(t, "guest");

    const { groupId } = await asA.mutation(api.contacts.createGroup, {
      name: "Dinner club",
      members: [userB],
    });

    await joinGroupAsUser(t, asB, groupId, userB);

    const group = await t.run(async (ctx) => ctx.db.get(groupId));
    expect(group?.members.some((m) => m.userId === userB)).toBe(true);
  });

  it("rejects acceptInvite for wrong user on direct invite", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "owner");
    const { userId: userB } = await createTestUser(t, "invited");
    const { asUser: asC } = await createTestUser(t, "intruder");

    const { groupId } = await asA.mutation(api.contacts.createGroup, {
      name: "Secret",
      members: [userB],
    });

    const token = await getDirectInviteToken(t, groupId, userB);
    expect(token).toBeTruthy();

    try {
      await asC.mutation(api.groupInvites.acceptInvite, { token: token! });
      expect.fail("should throw");
    } catch (error) {
      expectConvexError(error, "FORBIDDEN");
    }
  });

  it("declineInvite does not add member", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "admin");
    const { asUser: asB, userId: userB } = await createTestUser(t, "decliner");

    const { groupId } = await asA.mutation(api.contacts.createGroup, {
      name: "Maybe",
      members: [userB],
    });

    const token = await getDirectInviteToken(t, groupId, userB);
    await asB.mutation(api.groupInvites.declineInvite, { token: token! });

    const group = await t.run(async (ctx) => ctx.db.get(groupId));
    expect(group?.members.some((m) => m.userId === userB)).toBe(false);
  });

  it("rejects expired invite", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "old");
    const { asUser: asB, userId: userB } = await createTestUser(t, "late");

    const { groupId } = await asA.mutation(api.contacts.createGroup, {
      name: "Expired",
      members: [userB],
    });

    const token = await getDirectInviteToken(t, groupId, userB);
    await t.run(async (ctx) => {
      const invite = await ctx.db
        .query("groupInvites")
        .withIndex("by_token", (q) => q.eq("token", token!))
        .unique();
      if (invite) {
        await ctx.db.patch(invite._id, {
          expiresAt: Date.now() - 1000,
        });
      }
    });

    try {
      await asB.mutation(api.groupInvites.acceptInvite, { token: token! });
      expect.fail("should throw");
    } catch (error) {
      expectConvexError(error, "EXPIRED");
    }
  });

  it("joinByCode adds user via open invite", async () => {
    const { asUser: asA } = await createTestUser(t, "opener");
    const { asUser: asB, userId: userB } = await createTestUser(t, "coder");

    const { openInvite, groupId } = await asA.mutation(api.contacts.createGroup, {
      name: "Open house",
      members: [],
    });

    const result = await asB.mutation(api.groupInvites.joinByCode, {
      displayCode: openInvite.displayCode,
    });

    expect(result.groupId).toBe(groupId);
    const group = await t.run(async (ctx) => ctx.db.get(groupId));
    expect(group?.members.some((m) => m.userId === userB)).toBe(true);
  });

  it("getInvitePreview works without auth and omits sensitive data", async () => {
    const { asUser: asA } = await createTestUser(t, "public");

    const { openInvite } = await asA.mutation(api.contacts.createGroup, {
      name: "Preview group",
      description: "Test desc",
      members: [],
    });

    const preview = await t.query(api.groupInvites.getInvitePreview, {
      token: openInvite.token,
    });

    expect(preview?.groupName).toBe("Preview group");
    expect(preview?.inviterName).toContain("User");
    expect(preview).not.toHaveProperty("balances");
    expect(preview).not.toHaveProperty("expenses");
  });

  it("revokeInvite requires admin", async () => {
    const { asUser: asA } = await createTestUser(t, "revoker");
    const { asUser: asB, userId: userB } = await createTestUser(t, "invited");

    const { groupId } = await asA.mutation(api.contacts.createGroup, {
      name: "Revoke test",
      members: [userB],
    });

    const directInvite = await t.run(async (ctx) => {
      return await ctx.db
        .query("groupInvites")
        .withIndex("by_group_and_status", (q) =>
          q.eq("groupId", groupId).eq("status", "pending")
        )
        .filter((q) => q.eq(q.field("kind"), "direct"))
        .first();
    });

    try {
      await asB.mutation(api.groupInvites.revokeInvite, {
        inviteId: directInvite!._id as Id<"groupInvites">,
      });
      expect.fail("should throw");
    } catch (error) {
      expectConvexError(error, "FORBIDDEN");
    }

    await asA.mutation(api.groupInvites.revokeInvite, {
      inviteId: directInvite!._id as Id<"groupInvites">,
    });
  });
});
