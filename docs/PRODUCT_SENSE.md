# Product sense — user journeys

Short flows agents should understand before changing Splittaa behavior. Finnish UI; monetary amounts today are typically **decimal euros** in forms (integer-cents migration is out of scope for Phase 1).

---

## 0. Create profile (first sign-in)

**Actor:** New or legacy user without completed profile  
**Goal:** Set display name and unique username before using the app.

1. Sign in with Clerk → `users.store` provisions the row.
2. If `profileCompletedAt` is missing → redirect to **Luo profiili** (`/profiili/luo`).
3. Enter **näyttönimi** and **käyttäjänimi** (username suggested from Clerk name; availability checked live).
4. Submit → `users.completeProfile` → redirect to intended page or dashboard.

**Success:** User appears in participant search as `Nimi (@tunnus)`; email is not shown in search results.  
**Later:** Profile editable under **Asetukset**; username change limited to once per 30 days.

---

## 1. Split an expense

**Actor:** Signed-in user  
**Goal:** Record who paid and how cost is split.

1. Open **Uusi kulutus** (`/expenses/new`).
2. Enter description, amount (with currency — defaults to your preferred currency from settings), category, date.
3. Choose participants (search users or pick from group).
4. Configure split (equal, exact amounts, percentages — per `split-selector`).
5. Submit → Convex creates expense + participant rows → balances update.

**Success:** Expense is saved; user returns to **dashboard**. Balances update on dashboard and on group/person views when navigated there.  
**Failure modes:** Split does not sum to total; user not in group; unauthenticated.

---

## 2. Settle up

**Actor:** User who owes or is owed  
**Goal:** Record a payment that reduces balance.

1. From dashboard, group, or person view — open settlement flow (`/settlements/[type]/[id]`).
2. Confirm counterparty and amount (defaults from current balance).
3. Submit settlement mutation.
4. If you are owed money, you may send a **velkapyyntö** (debt request) from the person view, dashboard balance list (per person or **Lähetä kaikille** for all in Saldotiedot), or group balances — distinct from the automated email reminder in settings.

**Success:** Net balance between parties decreases; settlement appears in history.  
**Human-sensitive:** Wrong party or amount erodes trust — CODEOWNERS on `convex/settlements/`.

---

## 3. Groups

**Actor:** Group member  
**Goal:** Shared context for expenses and balances.

1. View group (`/groups/[id]`) — members, expenses, group balance.
2. Add expense in group context (participants pre-filled from members).
3. Settlements can be group-scoped.

**Creating a group (invite flow):**

1. Creator opens **Luo ryhmä** (contacts or dashboard).
2. Optionally selects users to **invite** — they are not added until they accept.
3. On create: creator is the only member; each invitee gets in-app pending invite + email (Resend).
4. Creator sees **join link**, **display code**, and **QR** for open invites (anyone with Splittaa account or new sign-up via `/join/[token]`).
5. Invitee opens link → preview → sign in/up → **Hyväksy** or **Hylkää** (direct only).
6. Alternatively: enter display code on the dashboard sidebar between **Saldotiedot** and **Ryhmäsi** (**Liity ryhmään koodilla**).
7. Invites expire after **7 days**; admins see pending invites on the group page and can revoke.

**Success:** Group balance reflects sum of member shares minus settlements; only accepted members appear in splits. Dashboard **Saldotiedot** and person view show **global net balance** between two users. With **autoNetBalances** on (default), personal and group shared expenses can reduce an existing debt the same way Splitwise does. With it off (Asetukset → Saldotiedot), only direct debts and personal settlements appear in global views — paying a shared expense does not automatically reduce debt.

---

## 4. Contacts

**Actor:** User building their network  
**Goal:** Find people and organize them.

1. **Yhteystiedot** (`/contacts`) — list contacts, search users.
2. Add contact / invite flows (email via Resend where implemented).
3. **Create group** from selected contacts (`create-group-modal`).

**Success:** New group exists; invited users appear after accept; contacts appear in participant search.

---

## 5. Events feed (`/toiminta`)

**Actor:** Signed-in user  
**Goal:** Review spending summary and recent money movements.

1. Open **Tapahtumat** from the header (separate from dashboard).
2. At the top: **Kulutusyhteenveto** — toggle **Viikko | Kuukausi | Vuosi**; bar chart (spending over time) and category donut; totals use **only the user’s split share** (not whole group bills).
3. Below: **Viimeisimmät tapahtumat** — expenses and settlements involving the user, newest first.
4. Each row shows amount, description, context (group or person), and link to detail.
5. Tap a row → group or person view.

---

## 6. Reminder settings (`/asetukset`)

**Actor:** Signed-in user  
**Goal:** Control email reminders about long-open balances.

1. Open **Asetukset** from the header.
2. Toggle reminders on/off.
3. Choose how often emails are sent (3–30 days) and how long a balance must be open before reminding.
4. Choose whether to remind when **you owe** others and/or when **others owe you**.

**Automation:** Inngest cron (`payment-reminders`) runs daily; eligible users receive email and an inbox message on `/viestit`.

---

## 7. Inbox (`/viestit`)

**Actor:** Signed-in user  
**Goal:** See app notifications in one place (in addition to email and existing UI).

1. Open **Viestit** from the header (badge shows unread count).
2. Messages include **group invites** (same actions as dashboard/join link) and **balance reminders** (when the daily email cron runs).
3. **Merkitse luetuksi** or open the linked action; accepting/declining a group invite marks the related message read.
4. Dashboard pending-invite card and email flows are unchanged — inbox is an extra channel.
5. **Velkapyyntö** — creditor can manually request payment from someone who owes them (person or group balance); separate from automated balance reminders. Debtor gets inbox message + email and can **Merkitse maksetuksi** in `/viestit` (records settlement + notifies creditor).

---

## 8. Dashboard (home after auth)

**Actor:** Returning user  
**Goal:** Situation awareness at a glance.

1. **Dashboard** (`/dashboard`) — pending group invites at top; join-by-code between **Saldotiedot** and **Ryhmäsi**; total balance cards; per-group summaries; **Kulutusyhteenveto** monthly stacked bar chart by category (22 fixed colors, all categories in legend).
2. Navigate to person or group for detail.

**Performance note:** Aggregates must use indexed queries — not full-table scans (harness Phase 3).

---

## 9. Topic workspaces (työpöydät)

**Actor:** Signed-in user  
**Goal:** Track expenses and goals for a specific topic (trip, savings, home) in a shared workspace separate from the global dashboard.

1. Sidebar lists **Työpöydät**; global home remains `/dashboard`.
2. **Luo työpöytä** (`/tyopoydat/uusi`) — name, preset theme (`matka`, `säästäminen`, `koti`, `yleinen`), one or more goals (budget cap and/or savings target).
3. **Työpöydän etusivu** (`/tyopoyta/[id]`) — goal progress cards, balance cards, expense summary, member list, join-by-code (admin creates open invite).
4. **Lisää kulu** from workspace → `/expenses/new?workspaceId=...` — participants are workspace members; balances stay in workspace scope.
5. **Säästötavoite** — record deposits manually; **budjettikatto** tracks total workspace expenses automatically.
6. Workspace data does **not** appear on the global dashboard.

---

## 9. Apuri (in-app guide)

**Actor:** Signed-in user (especially first-time after profile)  
**Goal:** Learn where features live and how to add an expense.

1. Open **Apuri** from the header (help icon, left of language switcher) — or it opens once automatically on **Etusivu** after profile is complete.
2. Step through: use case (multi-select + optional custom text) → experience level → tailored info steps → finish.
3. **Jatka** advances; **Ohita** dismisses and marks complete.
4. Finish step links to **Lisää uusi kulu** (`/expenses/new`).

**Success:** User can find dashboard balances, add an expense, and knows groups/contacts exist.  
**Not:** Profile onboarding (`/profiili/luo`) — that remains mandatory first.

---

## Domain glossary (Finnish → concept)

| UI (fi) | Meaning |
|---------|---------|
| Kulutus | Expense |
| Tasaus | Settlement |
| Ryhmä | Group |
| Yhteystiedot | Contacts |
| Saldo / velka | Balance / debt |

---

## Related

- [docs/DESIGN.md](DESIGN.md) — principles
- [ARCHITECTURE.md](../ARCHITECTURE.md) — technical domains
