# Product sense — user journeys

Short flows agents should understand before changing Splittaa behavior. Finnish UI; monetary amounts today are typically **decimal euros** in forms (integer-cents migration is out of scope for Phase 1).

---

## 1. Split an expense

**Actor:** Signed-in user  
**Goal:** Record who paid and how cost is split.

1. Open **Uusi kulutus** (`/expenses/new`).
2. Enter description, amount, category, date.
3. Choose participants (search users or pick from group).
4. Configure split (equal, exact amounts, percentages — per `split-selector`).
5. Submit → Convex creates expense + participant rows → balances update.

**Success:** All participants see updated balances on dashboard and group/person views.  
**Failure modes:** Split does not sum to total; user not in group; unauthenticated.

---

## 2. Settle up

**Actor:** User who owes or is owed  
**Goal:** Record a payment that reduces balance.

1. From dashboard, group, or person view — open settlement flow (`/settlements/[type]/[id]`).
2. Confirm counterparty and amount (defaults from current balance).
3. Submit settlement mutation.
4. If you are owed money, you may send a **velkapyyntö** (debt request) from the person view, dashboard balance list, or group balances — distinct from the automated email reminder in settings.

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

**Success:** Group balance reflects sum of member shares minus settlements; only accepted members appear in splits.

---

## 4. Contacts

**Actor:** User building their network  
**Goal:** Find people and organize them.

1. **Yhteystiedot** (`/contacts`) — list contacts, search users.
2. Add contact / invite flows (email via Resend where implemented).
3. **Create group** from selected contacts (`create-group-modal`).

**Success:** New group exists; invited users appear after accept; contacts appear in participant search.

---

## 5. Activity feed (`/toiminta`)

**Actor:** Signed-in user  
**Goal:** Review spending summary and recent money movements.

1. Open **Toiminta** from the header (separate from dashboard).
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

1. **Dashboard** (`/dashboard`) — pending group invites at top; join-by-code between **Saldotiedot** and **Ryhmäsi**; total balance cards; per-group summaries; monthly spending chart.
2. Navigate to person or group for detail.

**Performance note:** Aggregates must use indexed queries — not full-table scans (harness Phase 3).

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
