# Splittaa Security

Security reference for the Splittaa Convex public API. Last audited: 2026-06-01 (Phase 4).

**Auth mechanism:** Clerk JWT → `convex/_lib/auth.ts` (`requireAuth` / internal `getCurrentUser`). Unauthenticated callers receive `ConvexError` with code `UNAUTHENTICATED` or `USER_NOT_PROVISIONED`.

---

## Threat model

High-level risks from the [harness design spec](./superpowers/specs/2026-06-01-splittaa-harness-design.md):

- **Unauthenticated Convex access** — Any public query/mutation/action callable without a valid Clerk session could expose or mutate user financial data.
- **IDOR on expenses/groups** — Authenticated users accessing or modifying records they do not participate in (wrong group, wrong counterparty, forged payer).
- **Public seed / Inngest data paths** — Unrestricted database reads or writes via seed helpers or cron bridge actions could dump all users and balances.
- **Secret leak** — Committed `.env` files or client-exposed API keys (Resend, Inngest, Gemini) enable abuse or impersonation.
- **Email relay abuse** — A public send-mail action without server-side auth allows arbitrary outbound email via the app's Resend account.
- **XSS / clickjacking** — Unsanitized user content or missing HTTP security headers could compromise sessions (Clerk tokens in browser).

---

## Phase 0–4 completed items

- [x] Fix `.gitignore` — `.env`, `.env.*` ignored; `!.env.example` allowed
- [x] Create `.env.example`
- [x] `getCurrentUser` → internal in `convex/_lib/auth.ts`
- [x] `seedDatabase` → `internalMutation` with `ALLOW_DEV_SEED=true` guard
- [x] `seedTestFixtures` → internal E2E fixtures (same guard)
- [x] Inngest data queries → internal; `inngestBridge` secret-gated
- [x] `email.sendEmail` — `INNGEST_CONVEX_SECRET` via `assertAutomationSecret`; `RESEND_API_KEY` from Convex env only
- [x] `convex/_lib/authorize.ts` — group membership checks on expenses/settlements
- [x] HTTP security headers + CSP report-only in `next.config.ts`
- [x] `lib/config/env.ts` + `instrumentation.ts` production fail-fast
- [x] Public API matrix (this document)
- [x] convex-test coverage for auth, group IDOR, split validation
- [ ] Rotate keys if `.env` was ever committed — verify git history manually
- [ ] `createExpense` participant check (caller must be payer or in splits) — medium, deferred

---

## Environment variables

See [`.env.example`](../.env.example). Security-relevant vars:

| Variable | Scope | Purpose |
|----------|-------|---------|
| `CLERK_SECRET_KEY` | Server only | Clerk backend API |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex auth config | JWT validation |
| `INNGEST_CONVEX_SECRET` | Server + Convex env | Gates `inngestBridge.*` and `email.sendEmail` |
| `RESEND_API_KEY` | Convex env only | Email via Resend (not passed from client) |
| `ALLOW_DEV_SEED` | Convex env | Must be `true` to run `seed:seedDatabase` or `seedTest:seedTestFixtures` |
| `GEMINI_API_KEY` | Server only | AI spending insights in Inngest |

**Practices:**

- Never commit `.env` or `.env.local`.
- Set `INNGEST_CONVEX_SECRET` in Next.js/Inngest **and** Convex (`npx convex env set …`).
- Rotate keys if `.env` was ever tracked in git.

---

## HTTP security headers

Configured in `next.config.ts` (Phase 3):

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera/mic/geo disabled)
- `Content-Security-Policy-Report-Only` (tighten per Clerk/Convex before enforce)

---

## Public Convex API matrix

| Function | Type | Auth | Authz | Notes |
|----------|------|------|-------|-------|
| `inngestBridge.getUsersWithOutstandingDebts` | action | `INNGEST_CONVEX_SECRET` | System cron | Delegates to internal queries |
| `inngestBridge.getUsersWithExpenses` | action | Secret-gated | System cron | |
| `inngestBridge.getUserMonthlyExpenses` | action | Secret-gated | System cron | Takes `userId` |
| `email.sendEmail` | action | `assertAutomationSecret` | Automation only | `RESEND_API_KEY` from Convex env |
| `dashboard.getUserBalances` | query | `requireAuth` | Self-scoped | Indexed personal helpers |
| `dashboard.getTotalSpent` | query | `requireAuth` | Self-scoped | |
| `dashboard.getMonthlySpending` | query | `requireAuth` | Self-scoped | |
| `dashboard.getUserGroups` | query | `requireAuth` | Group membership | |
| `activity.getRecentActivity` | query | `requireAuth` | Self-scoped | Expenses/settlements user participates in; capped limit |
| `settings.getReminderSettings` | query | `requireAuth` | Self only | Reminder prefs |
| `settings.updateReminderSettings` | mutation | `requireAuth` | Self only | Email reminder prefs |
| `inngestBridge.getUsersForPaymentReminders` | action | `INNGEST_CONVEX_SECRET` | System cron | Eligible users for debt reminders |
| `inngestBridge.markReminderSent` | action | `INNGEST_CONVEX_SECRET` | System cron | Updates `lastSentAt` + inbox balance reminder |
| `notifications.listMyNotifications` | query | `requireAuth` | Self only | Inbox feed (capped) |
| `notifications.getUnreadCount` | query | `requireAuth` | Self only | Header badge |
| `notifications.markAsRead` | mutation | `requireAuth` | Owner only | |
| `notifications.markAllAsRead` | mutation | `requireAuth` | Self only | |
| `debtRequests.sendDebtRequest` | mutation | `requireAuth` | Creditor only; verified open debt | Inbox + email to debtor; 24h cooldown per pair/scope |
| `debtRequests.sendDebtRequestsBulk` | mutation | `requireAuth` | Creditor only; personal-scope debtors from global balance | Same as single send; skips cooldown/no-debt per person |
| `debtRequests.respondToDebtRequest` | mutation | `requireAuth` | Debtor only; creates settlement | Marks request handled; notifies creditor |
| `expenses.getExpensesBetweenUsers` | query | `requireAuth` | Counterparty filter | Rejects self |
| `expenses.createExpense` | mutation | `requireAuth` | Group member if `groupId` | See participant gap |
| `expenses.deleteExpense` | mutation | `requireAuth` | Creator or payer | |
| `groups.getGroupOrMembers` | query | `requireAuth` | Group membership | |
| `groups.getGroupExpenses` | query | `requireAuth` | Group membership | |
| `settlements.getSettlementData` | query | `requireAuth` | User or group scope | |
| `settlements.createSettlement` | mutation | `requireAuth` | Payer/receiver + group members | |
| `contacts.getAllContacts` | query | `requireAuth` | Self-scoped | |
| `contacts.createGroup` | mutation | `requireAuth` | Creator only as member; sends invites | Creates `groupInvites`, inbox message, schedules email |
| `groupInvites.getInvitePreview` | query | **None** | Public token lookup | Returns group name, inviter, member count only — no balances |
| `groupInvites.listMyPendingInvites` | query | `requireAuth` | Self-scoped | Direct pending invites |
| `groupInvites.getOpenInviteForGroup` | query | `requireAuth` | Group member | Join URL + display code |
| `groupInvites.listGroupInvites` | query | `requireAuth` | Group admin | Pending invites for admin UI |
| `groupInvites.acceptInvite` | mutation | `requireAuth` | Token + direct user match | Adds member |
| `groupInvites.declineInvite` | mutation | `requireAuth` | Direct invitee only | |
| `groupInvites.joinByCode` | mutation | `requireAuth` | Open invite code | |
| `groupInvites.revokeInvite` | mutation | `requireAuth` | Group admin | |
| `users.me` | query | `requireAuth` | Self only | Safe DTO incl. `profileCompleted`, `username` |
| `users.store` | mutation | Clerk identity | Self provision | First-login upsert; does not overwrite display name after profile complete |
| `users.completeProfile` | mutation | `requireAuth` | Self only; once | Sets display name + unique username |
| `users.suggestUsername` | query | `requireAuth` | Self only | Onboarding suggestion |
| `users.isUsernameAvailable` | query | `requireAuth` | Authenticated | Boolean only; no user leak |
| `users.updateDisplayName` | mutation | `requireAuth` | Self only | Requires completed profile |
| `users.updateUsername` | mutation | `requireAuth` | Self only | 30-day rate limit |
| `users.searchUsers` | query | `requireAuth` | Authenticated search | Min 2 chars; name + username + email search; response has no email |

**Internal only (not public):** `seed:seedDatabase`, `seedTest:seedTestFixtures`, `internal.inngest.*`, `internal._lib.auth.getCurrentUser`, `internal.email.sendGroupInviteEmail`, `internal.email.sendDebtRequestEmail`, `internal.notifications.deliverBalanceReminder`, `internal.notifications.deliverGroupInvite`.

---

## Known gaps

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| `createExpense` missing participant check | Medium | Require caller is payer or in `splits` |
| `users.store` uses plain `Error` on missing identity | Low | Align with `ConvexError` codes |
| `dashboard.getUserGroups` scans all groups | Low | Index by member (performance) |
| E2E auth in CI | Low | Enable Playwright job when Clerk test user + secrets exist |

---

## Related

- [RELIABILITY.md](./RELIABILITY.md) — local dev, E2E auth, CI
- [CONVEX.md](./CONVEX.md) — Convex patterns
- [QUALITY_SCORE.md](./QUALITY_SCORE.md) — domain grades
