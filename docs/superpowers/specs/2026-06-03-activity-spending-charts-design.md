# Toiminta-sivun kulutuskaaviot — design

**Date:** 2026-06-03  
**Status:** Approved — implemented 2026-06-03  
**Approach:** Extend `/toiminta` (option 2); no new header route.

---

## Goal

Signed-in user opens **Toiminta** and sees, above the existing activity list:

1. Period selector: **Viikko | Kuukausi | Vuosi**
2. Charts for **their own spending only** (all expenses they participate in)
3. Breakdown of **what they spent on** (categories)

The chronological feed below stays unchanged.

---

## User-facing UX

### Page layout (`/toiminta`)

```
[← Takaisin]
[Icon] Toiminta
       Updated subtitle: kulutusyhteenveto + tapahtumalista

┌─ Kulutusyhteenveto ─────────────────────────┐
│ [Viikko] [Kuukausi] [Vuosi]   (toggle group) │
│ Yhteensä: 123,45 € · 8 kulua                  │
│ [Bar chart: spending over time in period]     │
│ [Donut/pie: by category]                      │
└───────────────────────────────────────────────┘

┌─ Viimeisimmät tapahtumat ────────────────────┐
│ (existing ActivityFeed)                       │
└───────────────────────────────────────────────┘
```

- **Finnish copy** throughout; currency via `formatCurrency`.
- **Empty state:** “Ei kuluja valitulla jaksolla” when no expenses in range (charts hidden or zero-state message).
- **Loading:** skeleton or spinner in chart card while query is `undefined`.
- **No header change** — entry remains **Toiminta** (`History` icon).

### Period definitions (calendar, user locale = browser/local)

| Period | Range | Time buckets (bar chart X-axis) |
|--------|-------|----------------------------------|
| Viikko | Start of current ISO week (Mon 00:00) → now | Mon–Sun labels (only days with data required; show all 7 for consistency) |
| Kuukausi | Start of current calendar month → now | Day of month (1…N) or week-of-month; prefer **by day** for ≤31 bars |
| Vuosi | Start of current calendar year → now | Month abbreviations (tammi…joulu), same as dashboard `ExpenseSummary` |

---

## Metrics (privacy & correctness)

**Whose data:** Only `requireAuth()` user. No cross-user leakage.

**Which rows:** Every `expenses` document where the user is a participant:

- `expense.splits.some(s => s.userId === currentUserId)`, **or**
- `expense.paidByUserId === currentUserId` (included in filter; amount rule below)

**Amount per expense (chart total):** User’s **split share** only:

```ts
const userSplit = expense.splits.find((s) => s.userId === user._id);
const amount = userSplit?.amount ?? 0;
```

Aligns with `dashboard.getMonthlySpending` / `getTotalSpent`. If the user paid but has no split row, amount = 0 (edge case; same as dashboard today).

**What is excluded from charts:**

- **Settlements** — not “kulutus”; remain in activity list only.
- Expenses outside the selected period (by `expense.date`).

**Category:** `expense.category` (fallback `"Other"` / `muu`), labels from `lib/expense-categories.ts` (`name` in Finnish).

---

## Backend

### New public query: `activity.getSpendingSummary`

**File:** `convex/activity.ts` (keeps feed + analytics together).

**Args:**

```ts
period: v.union(v.literal("week"), v.literal("month"), v.literal("year"))
```

**Returns:**

```ts
{
  period: "week" | "month" | "year",
  rangeStart: number,      // timestamp
  rangeEnd: number,        // now (passed from client or computed in handler — prefer handler Date at mutation boundary; for query use expense dates only, end = max expense date or “end of period” constant — see note)
  totalAmount: number,
  expenseCount: number,
  byTime: { label: string; amount: number; sortKey: number }[],
  byCategory: { categoryId: string; label: string; amount: number }[],
}
```

**Implementation strategy:**

1. Reuse fetching patterns from `activity.getRecentActivity` / `_lib/personal.getPersonalExpensesForUser` + per-group `by_group` queries (already used for feed). **Do not** duplicate unbounded full-table scan on `expenses` if avoidable; filter by `date >= rangeStart` when collecting group/personal expenses.
2. Extract shared helper `getUserExpenseShare(expense, userId): number` in `convex/_lib/expenses.ts` (or `convex/_lib/spending.ts`) for use by `activity` and future refactor of `dashboard.getMonthlySpending`.
3. Aggregate in handler: sum shares, bucket by time label, bucket by category.
4. `requireAuth()` on entry.

**Performance note:** Current activity feed scans all groups with `.collect()` on groups table — acceptable for MVP; spending query should apply **date filter** before aggregation. Document in spec; follow-up index/query optimization is out of scope unless hot path regresses tests.

**Auth:** Document in `docs/SECURITY.md` matrix as authenticated read of own aggregates only.

---

## Frontend

### Components (new under `components/features/activity/`)

| Component | Responsibility |
|-----------|----------------|
| `spending-period-toggle.tsx` | Viikko / Kuukausi / Vuosi; controlled state |
| `spending-charts.tsx` | Summary totals + recharts bar + pie/donut |
| (optional) `spending-chart-empty.tsx` | Empty state |

**Patterns:**

- `useQuery(api.activity.getSpendingSummary, { period })` — Convex React, not `useConvexQuery`.
- Recharts: mirror `components/features/dashboard/expense-summary.tsx` (ResponsiveContainer, `formatCurrency` in tooltip).
- shadcn `Card`, `ToggleGroup` or segmented `Button` variant for period.
- `data-testid`: `spending-period-week`, `spending-period-month`, `spending-period-year`, `spending-total`, `spending-chart-time`, `spending-chart-category`.

### Page change

`app/(main)/toiminta/page.tsx`:

- Import `SpendingCharts` above `<ActivityFeed />`.
- Update page description text.
- Section heading: **Kulutusyhteenveto**; subheading for feed: **Viimeisimmät tapahtumat** (optional clarity).

---

## Relationship to dashboard

`ExpenseSummary` on dashboard already shows **yearly** monthly bars. This feature adds **week/month/year** + **category** on Toiminta. Intentional overlap for year view is acceptable; later refactor can share one hook/query. **Not in scope:** remove dashboard card.

---

## Testing

| Layer | What |
|-------|------|
| `tests/convex/activity.test.ts` | `getSpendingSummary`: auth required; only user’s split amounts; category buckets; period boundaries |
| E2E (optional Phase 4) | `/toiminta` period toggle + `data-testid` visible — add if stable seed exists |

---

## Documentation updates

- `docs/PRODUCT_SENSE.md` §5 — add steps for charts + period toggle.
- `docs/FRONTEND.md` — E2E testids for spending charts.

---

## Out of scope

- New header link or `/kulutus` route
- Group filter dropdown
- Settlements in charts
- Export CSV / PDF
- Historical years before current (year = current calendar year only)
- Replacing dashboard `ExpenseSummary`
- Convex pre-aggregated stats table

---

## Approval checklist

- [ ] User confirms approach 2 and metrics (split share only, expenses only)
- [ ] User approves period UX (single page, toggle on `/toiminta`)
- [ ] Proceed to implementation plan (`writing-plans` skill)
