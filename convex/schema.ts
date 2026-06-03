import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    imageUrl: v.optional(v.string()),
    reminderSettings: v.optional(
      v.object({
        enabled: v.boolean(),
        intervalDays: v.union(
          v.literal(3),
          v.literal(7),
          v.literal(14),
          v.literal(30)
        ),
        minAgeDays: v.union(
          v.literal(3),
          v.literal(7),
          v.literal(14),
          v.literal(30)
        ),
        notifyWhenIOwe: v.boolean(),
        notifyWhenOwedToMe: v.boolean(),
        lastSentAt: v.optional(v.number()),
      })
    ),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_email", { searchField: "email" }),

  // Expenses
  expenses: defineTable({
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.number(), // timestamp
    paidByUserId: v.id("users"), // Reference to users table
    splitType: v.string(), // "equal", "percentage", "exact"
    splits: v.array(
      v.object({
        userId: v.id("users"), // Reference to users table
        amount: v.number(), // amount owed by this user
        paid: v.boolean(),
      })
    ),
    groupId: v.optional(v.id("groups")), // null for one-on-one expenses
    createdBy: v.id("users"), // Reference to users table
  })
    .index("by_group", ["groupId"])
    .index("by_user_and_group", ["paidByUserId", "groupId"])
    .index("by_date", ["date"]),

  // Settlements
  settlements: defineTable({
    amount: v.number(),
    note: v.optional(v.string()),
    date: v.number(), // timestamp
    paidByUserId: v.id("users"), // Reference to users table
    receivedByUserId: v.id("users"), // Reference to users table
    groupId: v.optional(v.id("groups")), // null for one-on-one settlements
    relatedExpenseIds: v.optional(v.array(v.id("expenses"))), // Which expenses this settlement covers
    createdBy: v.id("users"), // Reference to users table
  })
    .index("by_group", ["groupId"])
    .index("by_user_and_group", ["paidByUserId", "groupId"])
    .index("by_receiver_and_group", ["receivedByUserId", "groupId"])
    .index("by_date", ["date"]),

  // Balance snapshots (materialized from expenses + settlements)
  balances: defineTable({
    scopeType: v.union(v.literal("personal"), v.literal("group")),
    scopeGroupId: v.optional(v.id("groups")),
    userId: v.id("users"),
    counterpartyUserId: v.id("users"),
    amount: v.number(), // userId owes counterpartyUserId when > 0
    updatedAt: v.number(),
  })
    .index("by_scope_pair", ["scopeType", "scopeGroupId", "userId", "counterpartyUserId"])
    .index("by_user_scope", ["userId", "scopeType", "scopeGroupId"])
    .index("by_scope", ["scopeType", "scopeGroupId"]),

  // Groups
  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"), // Reference to users table
    members: v.array(
      v.object({
        userId: v.id("users"), // Reference to users table
        role: v.string(), // "admin" or "member"
        joinedAt: v.number(),
      })
    ),
  }),

  // Group membership invites (direct + open join link/code)
  groupInvites: defineTable({
    groupId: v.id("groups"),
    invitedBy: v.id("users"),
    invitedUserId: v.optional(v.id("users")),
    token: v.string(),
    displayCode: v.optional(v.string()),
    kind: v.union(v.literal("direct"), v.literal("open")),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("expired"),
      v.literal("revoked")
    ),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_display_code", ["displayCode"])
    .index("by_group_and_status", ["groupId", "status"])
    .index("by_invited_user_and_status", ["invitedUserId", "status"]),

  // In-app inbox (group invites, balance reminders, future alerts)
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("group_invite"),
      v.literal("balance_reminder"),
      v.literal("debt_request"),
      v.literal("debt_request_paid")
    ),
    title: v.string(),
    body: v.string(),
    href: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
    relatedInviteId: v.optional(v.id("groupInvites")),
    dedupeKey: v.optional(v.string()),
    debtRequestCreditorId: v.optional(v.id("users")),
    debtRequestAmount: v.optional(v.number()),
    debtRequestGroupId: v.optional(v.id("groups")),
    debtRequestRespondedAt: v.optional(v.number()),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_user_unread", ["userId", "isRead"])
    .index("by_user_dedupe", ["userId", "dedupeKey"]),
});
