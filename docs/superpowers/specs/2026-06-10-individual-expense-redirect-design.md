# Individual expense redirect — design

**Date:** 2026-06-10  
**Status:** Approved (brainstorming)  
**Scope:** Frontend navigation only — no Convex or balance logic changes.

---

## Problem

After creating a **henkilökohtainen kulu** (individual expense with another person) on `/expenses/new`, the app redirects to `/person/[counterpartyId]`. That page prominently shows how much the user owes that person (*Olet velkaa …* + amount). Users who just recorded a shared payment want to return to the overview, not stare at the pairwise debt.

---

## Goal

On successful individual expense creation, redirect to **dashboard** (`/dashboard`) instead of the person view. Do not change group expense flow.

---

## Non-goals

- Changing settlement (`/settlements/...`) redirect behavior.
- Hiding the counterparty from dashboard **Saldotiedot** — aggregate balance list may still show them if debt exists.
- `router.back()` or `returnTo` query params (rejected: person-page return path contradicts the goal).

---

## Solution

**File:** `app/(main)/expenses/new/page.tsx`

| Tab | Before | After |
|-----|--------|-------|
| Henkilökohtainen kulu | `onSuccess(id) → id ? /person/${id} : /dashboard` | `onSuccess → /dashboard` always |
| Ryhmäkulu | `onSuccess(id) → /groups/${id}` | unchanged |

`ExpenseForm` continues to call `onSuccess(otherUserId)` for individual type; the page callback ignores the id.

Toast (*Kulu luotu*) stays in `expense-form.tsx`.

---

## Error handling

Unchanged — failed mutations stay on the form with error toast; no navigation.

---

## Testing

| Layer | Action |
|-------|--------|
| Manual | Create individual expense with one other participant → lands on `/dashboard`, not `/person/...` |
| Manual | Create group expense → still lands on `/groups/[id]` |
| E2E | Optional follow-up: extend `tests/e2e/expense-create.spec.ts` when full create flow is automated |
| `npm run verify` | Must pass after change |

No new unit tests — navigation-only change.

---

## Documentation

Update **docs/PRODUCT_SENSE.md** journey §1 (*Split an expense*):

- **Success:** Participants see updated balances on dashboard and group/person views (when they navigate there).
- Remove implicit expectation that individual expense submit opens person view.

---

## Related

- [PRODUCT_SENSE.md](../../PRODUCT_SENSE.md) — journey §1
- [FRONTEND.md](../../FRONTEND.md) — client navigation patterns
