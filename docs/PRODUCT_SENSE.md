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

**Success:** Net balance between parties decreases; settlement appears in history.  
**Human-sensitive:** Wrong party or amount erodes trust — CODEOWNERS on `convex/settlements/`.

---

## 3. Groups

**Actor:** Group member  
**Goal:** Shared context for expenses and balances.

1. View group (`/groups/[id]`) — members, expenses, group balance.
2. Add expense in group context (participants pre-filled from members).
3. Settlements can be group-scoped.

**Success:** Group balance reflects sum of member shares minus settlements.  
**Note:** Creating groups may start from contacts flow (modal).

---

## 4. Contacts

**Actor:** User building their network  
**Goal:** Find people and organize them.

1. **Yhteystiedot** (`/contacts`) — list contacts, search users.
2. Add contact / invite flows (email via Resend where implemented).
3. **Create group** from selected contacts (`create-group-modal`).

**Success:** New group exists with chosen members; contacts appear in participant search.

---

## 5. Dashboard (home after auth)

**Actor:** Returning user  
**Goal:** Situation awareness at a glance.

1. **Dashboard** (`/dashboard`) — total balance, per-group summaries, monthly spending chart.
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
