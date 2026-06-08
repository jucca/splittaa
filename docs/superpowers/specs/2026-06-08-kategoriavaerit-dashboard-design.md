# Kategoriavärit etusivun kaaviossa — design

**Date:** 2026-06-08  
**Status:** Approved — implemented 2026-06-08  
**Approach:** Värit `lib/expense-categories.ts` -tiedostossa (option 1); pinottu kuukausikaavio etusivulla.

---

## Goal

Signed-in user opens **Etusivu** (`/dashboard`) and sees the existing **Kulutusyhteenveto** card with a **stacked monthly bar chart**: each month is one bar, segments colored by **expense category**. All **22 categories** always appear in the legend with a fixed color. The same palette is reused app-wide (Toiminta donut, expense list).

---

## Decisions (brainstorming)

| Topic | Choice |
|-------|--------|
| Target chart | Etusivu monthly bar chart (`ExpenseSummary`) |
| Chart type | Stacked bar — one bar per month, categories as colored segments |
| Categories shown | All 22 always (including zero-amount months) |
| Color source | Single palette in `lib/expense-categories.ts`, shared across app |
| Scope | Dashboard chart + global palette rollout (Toiminta, expense list dot) |

---

## User-facing UX

### Etusivu — `ExpenseSummary`

```
┌─ Kulutusyhteenveto ──────────────────────────┐
│ [Tässä kuussa]  [Tänä vuonna]               │
│                                              │
│ [Stacked bar chart: 12 months]              │
│  tammi | helmi | … | joulu                   │
│  each bar = category segments (22 colors)   │
│                                              │
│ [Legend: 22 categories, flex-wrap, 2+ rows] │
│ Kulutus kuukausittain (2026)                  │
└──────────────────────────────────────────────┘
```

- **Upper summary boxes** unchanged (`totalThisMonth`, `totalThisYear`).
- **X-axis:** Short month names via existing `dashboard.monthShort.*` i18n keys.
- **Y-axis:** Amount in viewer currency (`useMoney().format` in tooltip).
- **Stack order:** Fixed — same order as `EXPENSE_CATEGORIES` object keys (not sorted by amount).
- **Tooltip:** Month name as title; list categories with `amount > 0` descending; color swatch + localized label + amount; total at bottom.
- **Legend:** All 22 categories with color dot + localized name; `flex-wrap` below chart; always visible.
- **Empty year:** Bars height 0 (no separate empty-state copy) — same as today when all totals are zero.
- **Loading:** Parent dashboard spinner unchanged.

### Global palette consumers

| Location | Change |
|----------|--------|
| `components/features/dashboard/expense-summary.tsx` | Stacked bars + legend |
| `components/features/activity/spending-charts.tsx` | Donut `Cell` + legend use `getCategoryColor(categoryId)`; remove `CHART_COLORS` |
| `components/features/expenses/expense-list.tsx` | Small color dot beside category icon |
| `components/features/expenses/category-selector.tsx` | No change (icon only) |

Time-series bars on Toiminta stay single brand color (`#36d7b7`) — out of scope for category coloring.

---

## Metrics (privacy & correctness)

Same rules as existing `dashboard.getMonthlySpending`:

- **Auth:** `requireAuth()` only.
- **Rows:** Expenses where user participates (`getAllExpensesForUser` + `userParticipatesInExpense`).
- **Amount:** User's **split share** only (`getUserExpenseShare`); skip if share ≤ 0.
- **Period:** Current calendar year (`expense.date >= Jan 1 00:00 local year`).
- **Currency:** `convertToViewer` with `viewerCurrency(user)`.
- **Category id:** `expense.category ?? "other"`; normalize legacy `"Other"` → `"other"`; unknown id → `"other"`.

Settlements excluded. `total` per month must equal sum of `byCategory` amounts.

---

## Backend

### Extend `dashboard.getMonthlySpending`

**File:** `convex/dashboard.ts`

**Return shape (extended):**

```ts
{
  months: Array<{
    month: number;   // start-of-month timestamp
    total: number;   // unchanged — sum of byCategory
    byCategory: Array<{
      categoryId: string;
      amount: number;
    }>;
  }>;
  currency: string;
}
```

**`byCategory` rules:**

- Always **22 entries** per month — one per canonical category id from shared constant list.
- `amount: 0` when no spending in that category/month.
- Order: canonical category order (not amount-sorted).

**Implementation:**

1. Initialize per-month map: `categoryId → amount` for all 22 ids.
2. Loop expenses (same as today); increment matching category bucket.
3. Emit `byCategory` array in fixed order.

No schema change. No new public query.

---

## Frontend — color palette

### `lib/expense-categories.ts`

Add `color: string` (hex) to each category entry.

New exports:

```ts
export const CATEGORY_IDS: ExpenseCategoryId[]; // stable order for charts
export function getCategoryColor(categoryId: string): string;
```

- Unknown / legacy ids → `EXPENSE_CATEGORIES.other.color`.
- **22 distinct saturated colors** — semantic hints where natural (e.g. water blue, food warm) but **distinctiveness** is the priority.
- Colors must remain readable on light card background and in dark mode (sufficient contrast against white/black chart backgrounds).

### `lib/types/domain.ts`

```ts
export type MonthlySpendingItem = {
  month: number;
  total: number;
  byCategory: Array<{ categoryId: string; amount: number }>;
};
```

### `ExpenseSummary` chart data

Transform API rows to Recharts format:

```ts
{ name: "tammi", foodDrink: 120, travel: 45, coffee: 0, ... }
```

Render 22 `<Bar stackId="month" dataKey={id} fill={getCategoryColor(id)} />` components.

**Test ids:** Keep existing dashboard loading; add `data-testid="expense-summary-chart"` on chart container and `expense-summary-legend` on legend.

---

## Edge cases

| Case | Behavior |
|------|----------|
| `category: "Other"` (legacy) | Normalize to `"other"` in aggregation |
| Unknown category string | Map to `"other"` |
| Month with no expenses | `total: 0`, all `byCategory` amounts 0 |
| Category with no expenses in year | Still in legend; segments height 0 every month |
| User paid but no split row | amount 0 (unchanged dashboard behavior) |

---

## Testing

| Layer | What |
|-------|------|
| `tests/unit/category-colors.test.ts` | All 22 categories have unique `color`; `getCategoryColor` + fallback |
| `tests/convex/dashboard-monthly-spending.test.ts` | `byCategory` buckets; month totals; normalization; auth |

Optional: snapshot of chart data transform in unit test (no visual regression).

---

## Documentation updates

- `docs/PRODUCT_SENSE.md` — Etusivu journey: stacked category chart in Kulutusyhteenveto.
- `docs/FRONTEND.md` — new `data-testid`s for expense summary chart/legend.

No `docs/SECURITY.md` change (`getMonthlySpending` already authenticated).

---

## Out of scope

- User-customizable category colors
- Storing colors in Convex
- Category colors on Toiminta time-series bar chart
- Top-N / dynamic category hiding
- Dashboard chart period toggle (stays current year only)
- Group or person view charts

---

## Approval checklist

- [x] Stacked monthly bar on Etusivu
- [x] All 22 categories with fixed colors
- [x] Global palette in `lib/expense-categories.ts`
- [x] Extend `getMonthlySpending` with `byCategory`
- [ ] User reviews written spec
- [ ] Proceed to implementation plan (`writing-plans` skill)
