import { describe, expect, it } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import {
  createTestConvex,
  createTestUser,
  getDirectInviteToken,
} from "./helpers";

describe("notifications", () => {
  const t = createTestConvex();

  it("creates inbox message for direct group invite", async () => {
    const { asUser: asA } = await createTestUser(t, "inviter");
    const { asUser: asB, userId: userB } = await createTestUser(t, "invitee");

    const { groupId } = await asA.mutation(api.contacts.createGroup, {
      name: "Inbox test",
      members: [userB],
    });

    const messages = await asB.query(api.notifications.listMyNotifications, {});
    expect(messages.length).toBeGreaterThanOrEqual(1);
    const inviteMsg = messages.find((m) => m.type === "group_invite");
    expect(inviteMsg?.title).toContain("Inbox test");
    expect(inviteMsg?.isRead).toBe(false);
    expect(inviteMsg?.href).toContain("/join/");

    const token = await getDirectInviteToken(t, groupId, userB);
    await asB.mutation(api.groupInvites.acceptInvite, { token: token! });

    const afterAccept = await asB.query(api.notifications.listMyNotifications, {});
    const readMsg = afterAccept.find((m) => m.type === "group_invite");
    expect(readMsg?.isRead).toBe(true);
  });

  it("getUnreadCount reflects unread messages", async () => {
    const { asUser: asA } = await createTestUser(t, "sender");
    const { asUser: asB, userId: userB } = await createTestUser(t, "receiver");

    await asA.mutation(api.contacts.createGroup, {
      name: "Unread",
      members: [userB],
    });

    const count = await asB.query(api.notifications.getUnreadCount);
    expect(count).toBeGreaterThanOrEqual(1);

    await asB.mutation(api.notifications.markAllAsRead, {});
    const after = await asB.query(api.notifications.getUnreadCount);
    expect(after).toBe(0);
  });

  it("delivers balance reminder inbox message", async () => {
    const { asUser, userId } = await createTestUser(t, "debtor");

    await t.mutation(internal.notifications.deliverBalanceReminder, {
      userId,
      sentAt: Date.now(),
      iOwe: [{ name: "Matti", amount: 12.5 }],
      owedToMe: [],
    });

    const messages = await asUser.query(api.notifications.listMyNotifications, {});
    const reminder = messages.find((m) => m.type === "balance_reminder");
    expect(reminder?.title).toBe("Saldomuistutus");
    expect(reminder?.body).toContain("Matti");
    expect(reminder?.href).toBe("/dashboard");
  });
});
