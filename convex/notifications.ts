import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuth } from "./_lib/auth";
import {
  deliverBalanceReminderNotification,
  deliverGroupInviteNotification,
  markInviteNotificationsRead,
} from "./_lib/notifications";

const MAX_LIST = 50;

export const listMyNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const currentUser = await requireAuth(ctx);
    const take = Math.min(limit ?? MAX_LIST, MAX_LIST);

    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .take(take);

    return rows.map((row) => ({
      id: row._id,
      type: row.type,
      title: row.title,
      body: row.body,
      href: row.href ?? null,
      isRead: row.isRead,
      createdAt: row.createdAt,
      relatedInviteId: row.relatedInviteId ?? null,
      debtRequestCreditorId: row.debtRequestCreditorId ?? null,
      debtRequestAmount: row.debtRequestAmount ?? null,
      debtRequestGroupId: row.debtRequestGroupId ?? null,
      debtRequestRespondedAt: row.debtRequestRespondedAt ?? null,
      canMarkPaid:
        row.type === "debt_request" && !row.debtRequestRespondedAt,
    }));
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await requireAuth(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", currentUser._id).eq("isRead", false)
      )
      .collect();
    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const currentUser = await requireAuth(ctx);
    const notification = await ctx.db.get(notificationId);
    if (!notification) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Viestiä ei löytynyt",
      });
    }
    if (notification.userId !== currentUser._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Et voi muokata toisen käyttäjän viestejä",
      });
    }
    if (!notification.isRead) {
      await ctx.db.patch(notificationId, { isRead: true });
    }
    return { success: true as const };
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await requireAuth(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", currentUser._id).eq("isRead", false)
      )
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
    return { updated: unread.length };
  },
});

/** Internal: inbox message when a direct group invite is created. */
export const deliverGroupInvite = internalMutation({
  args: {
    userId: v.id("users"),
    inviteId: v.id("groupInvites"),
    groupName: v.string(),
    inviterName: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await deliverGroupInviteNotification(ctx, args);
  },
});

/** Internal: inbox message when a balance reminder email is sent. */
export const deliverBalanceReminder = internalMutation({
  args: {
    userId: v.id("users"),
    sentAt: v.number(),
    iOwe: v.array(v.object({ name: v.string(), amount: v.number() })),
    owedToMe: v.array(v.object({ name: v.string(), amount: v.number() })),
  },
  handler: async (ctx, args) => {
    await deliverBalanceReminderNotification(ctx, args);
  },
});
