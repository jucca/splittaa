# Kategoriavärit etusivun kaaviossa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pinottu kuukausikaavio etusivulla, jossa jokaisella 22 maksukategorialla on kiinteä väri; sama paletti Toiminta-donutissa ja kululistassa.

**Architecture:** Värit ja `CATEGORY_IDS` määritellään `lib/expense-categories.ts`-tiedostossa. Convex käyttää peilikuvaa `convex/_lib/categories.ts` (ei voi importata `lib/`-polusta). `dashboard.getMonthlySpending` palauttaa kuukausittain `byCategory`-jaon. `ExpenseSummary` renderöi 22 pinottua Recharts-`Bar`-segmenttiä.

**Tech Stack:** Next.js 15, React 19, Recharts, Convex, Vitest, next-intl

**Spec:** `docs/superpowers/specs/2026-06-08-kategoriavaerit-dashboard-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `lib/expense-categories.ts` | `color` per category, `CATEGORY_IDS`, `normalizeCategoryId`, `getCategoryColor` |
| `convex/_lib/categories.ts` | Backend category id list + `normalizeExpenseCategoryId` (mirror of lib) |
| `convex/dashboard.ts` | Extend `getMonthlySpending` with `byCategory` |
| `lib/types/domain.ts` | Extend `MonthlySpendingItem` type |
| `components/features/dashboard/expense-summary.tsx` | Stacked chart, custom tooltip, legend |
| `components/features/activity/spending-charts.tsx` | Use `getCategoryColor`; remove `CHART_COLORS` |
| `components/features/expenses/expense-list.tsx` | Category color dot |
| `tests/unit/category-colors.test.ts` | Palette + helper tests |
| `tests/convex/dashboard-monthly-spending.test.ts` | `byCategory` aggregation tests |
| `docs/PRODUCT_SENSE.md` | Dashboard journey update |
| `docs/FRONTEND.md` | New `data-testid`s |

---

### Task 1: Category color palette and helpers (lib)

**Files:**
- Modify: `lib/expense-categories.ts`
- Create: `tests/unit/category-colors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/category-colors.test.ts
import { describe, expect, it } from "vitest";
import {
  CATEGORY_IDS,
  EXPENSE_CATEGORIES,
  getCategoryColor,
  normalizeCategoryId,
} from "@/lib/expense-categories";

describe("category colors", () => {
  it("has exactly 22 category ids", () => {
    expect(CATEGORY_IDS).toHaveLength(22);
  });

  it("assigns a unique hex color to every category", () => {
    const colors = CATEGORY_IDS.map((id) => EXPENSE_CATEGORIES[id].color);
    expect(new Set(colors).size).toBe(22);
    for (const color of colors) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("getCategoryColor returns the category color", () => {
    expect(getCategoryColor("travel")).toBe(EXPENSE_CATEGORIES.travel.color);
  });

  it("getCategoryColor falls back to other for unknown ids", () => {
    expect(getCategoryColor("nope")).toBe(EXPENSE_CATEGORIES.other.color);
    expect(getCategoryColor("Other")).toBe(EXPENSE_CATEGORIES.other.color);
  });

  it("normalizeCategoryId maps legacy Other to other", () => {
    expect(normalizeCategoryId("Other")).toBe("other");
    expect(normalizeCategoryId(undefined)).toBe("other");
    expect(normalizeCategoryId("coffee")).toBe("coffee");
    expect(normalizeCategoryId("bogus")).toBe("other");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/category-colors.test.ts`
Expected: FAIL — `CATEGORY_IDS` / `color` / helpers not defined

- [ ] **Step 3: Implement palette and helpers**

Add `color` to every entry in `EXPENSE_CATEGORIES` and append exports at bottom of `lib/expense-categories.ts`:

```ts
export const CATEGORY_IDS = Object.keys(
  EXPENSE_CATEGORIES
) as ExpenseCategoryId[];

const CATEGORY_COLORS: Record<ExpenseCategoryId, string> = {
  foodDrink: "#E53935",
  coffee: "#795548",
  groceries: "#43A047",
  shopping: "#8E24AA",
  travel: "#1E88E5",
  transportation: "#546E7A",
  housing: "#A1887F",
  entertainment: "#FB8C00",
  tickets: "#D81B60",
  utilities: "#FDD835",
  water: "#039BE5",
  education: "#5E35B1",
  health: "#C62828",
  personal: "#EC407A",
  gifts: "#FF7043",
  technology: "#3949AB",
  bills: "#607D8B",
  baby: "#FFB300",
  music: "#9C27B0",
  books: "#5D4037",
  other: "#9E9E9E",
  general: "#00897B",
};

// Merge colors into EXPENSE_CATEGORIES entries:
// foodDrink: { id: "foodDrink", name: "...", icon: Utensils, color: CATEGORY_COLORS.foodDrink },
// ... repeat for all 22

export function normalizeCategoryId(
  categoryId: string | undefined
): ExpenseCategoryId {
  if (!categoryId || categoryId === "Other") return "other";
  if (categoryId in EXPENSE_CATEGORIES) {
    return categoryId as ExpenseCategoryId;
  }
  return "other";
}

export function getCategoryColor(categoryId: string): string {
  return EXPENSE_CATEGORIES[normalizeCategoryId(categoryId)].color;
}
```

Implementation note: add `color: string` to the type of each category object inline (use `CATEGORY_COLORS` when building or spread `color: CATEGORY_COLORS.foodDrink` per key).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/category-colors.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/expense-categories.ts tests/unit/category-colors.test.ts
git commit -m "feat: add fixed color palette for expense categories"
```

---

### Task 2: Backend category helpers and getMonthlySpending

**Files:**
- Create: `convex/_lib/categories.ts`
- Modify: `convex/dashboard.ts`
- Create: `tests/convex/dashboard-monthly-spending.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/convex/dashboard-monthly-spending.test.ts
import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { createTestConvex, createTestUser } from "./helpers";
import { EXPENSE_CATEGORY_IDS } from "../../convex/_lib/categories";

describe("dashboard.getMonthlySpending", () => {
  const t = createTestConvex();

  it("returns byCategory with all 22 categories per month", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "dash-a");
    const { userId: userB } = await createTestUser(t, "dash-b");

    const now = Date.now();

    await asA.mutation(api.expenses.createExpense, {
      description: "Kahvi",
      amount: 10,
      category: "coffee",
      date: now,
      paidByUserId: userA,
      splitType: "equal",
      splits: [
        { userId: userA, amount: 5, paid: true },
        { userId: userB, amount: 5, paid: false },
      ],
    });

    await asA.mutation(api.expenses.createExpense, {
      description: "Matka",
      amount: 40,
      category: "travel",
      date: now,
      paidByUserId: userA,
      splitType: "equal",
      splits: [
        { userId: userA, amount: 20, paid: true },
        { userId: userB, amount: 20, paid: false },
      ],
    });

    const result = await asA.query(api.dashboard.getMonthlySpending, {});

    expect(result.months).toHaveLength(12);

    const currentMonth = new Date().getMonth();
    const monthRow = result.months[currentMonth];
    expect(monthRow.total).toBe(25);
    expect(monthRow.byCategory).toHaveLength(22);

    const coffee = monthRow.byCategory.find((c) => c.categoryId === "coffee");
    const travel = monthRow.byCategory.find((c) => c.categoryId === "travel");
    const groceries = monthRow.byCategory.find(
      (c) => c.categoryId === "groceries"
    );

    expect(coffee?.amount).toBe(5);
    expect(travel?.amount).toBe(20);
    expect(groceries?.amount).toBe(0);

    const categoryOrder = monthRow.byCategory.map((c) => c.categoryId);
    expect(categoryOrder).toEqual([...EXPENSE_CATEGORY_IDS]);
  });

  it("normalizes legacy Other category to other", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "dash-legacy");

    await asA.mutation(api.expenses.createExpense, {
      description: "Legacy",
      amount: 12,
      category: "Other",
      date: Date.now(),
      paidByUserId: userA,
      splitType: "equal",
      splits: [{ userId: userA, amount: 12, paid: true }],
    });

    const result = await asA.query(api.dashboard.getMonthlySpending, {});
    const monthRow = result.months[new Date().getMonth()];
    const other = monthRow.byCategory.find((c) => c.categoryId === "other");

    expect(other?.amount).toBe(12);
  });

  it("requires authentication", async () => {
    await expect(t.query(api.dashboard.getMonthlySpending, {})).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/convex/dashboard-monthly-spending.test.ts`
Expected: FAIL — `byCategory` missing or `EXPENSE_CATEGORY_IDS` not found

- [ ] **Step 3: Create convex/_lib/categories.ts**

```ts
// convex/_lib/categories.ts
// Must stay in sync with lib/expense-categories.ts CATEGORY_IDS order.

export const EXPENSE_CATEGORY_IDS = [
  "foodDrink",
  "coffee",
  "groceries",
  "shopping",
  "travel",
  "transportation",
  "housing",
  "entertainment",
  "tickets",
  "utilities",
  "water",
  "education",
  "health",
  "personal",
  "gifts",
  "technology",
  "bills",
  "baby",
  "music",
  "books",
  "other",
  "general",
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORY_IDS)[number];

const CATEGORY_ID_SET = new Set<string>(EXPENSE_CATEGORY_IDS);

export function normalizeExpenseCategoryId(
  raw: string | undefined
): ExpenseCategoryId {
  if (!raw || raw === "Other") return "other";
  if (CATEGORY_ID_SET.has(raw)) return raw as ExpenseCategoryId;
  return "other";
}

export function emptyCategoryTotals(): Map<ExpenseCategoryId, number> {
  return new Map(
    EXPENSE_CATEGORY_IDS.map((id) => [id, 0] as const)
  );
}

export function categoryTotalsToArray(
  totals: Map<ExpenseCategoryId, number>
): { categoryId: string; amount: number }[] {
  return EXPENSE_CATEGORY_IDS.map((categoryId) => ({
    categoryId,
    amount: totals.get(categoryId) ?? 0,
  }));
}
```

- [ ] **Step 4: Extend getMonthlySpending in convex/dashboard.ts**

Add import:

```ts
import {
  categoryTotalsToArray,
  emptyCategoryTotals,
  normalizeExpenseCategoryId,
} from "./_lib/categories";
```

Replace monthly aggregation loop body:

```ts
const monthlyCategoryTotals = new Map<number, Map<ExpenseCategoryId, number>>();
for (let i = 0; i < 12; i++) {
  const monthStart = new Date(currentYear, i, 1).getTime();
  monthlyTotals[monthStart] = 0;
  monthlyCategoryTotals.set(monthStart, emptyCategoryTotals());
}

for (const expense of expenses) {
  if (expense.date < startOfYear) continue;
  if (!userParticipatesInExpense(expense, user._id)) continue;
  const share = getUserExpenseShare(expense, user._id);
  if (share <= 0) continue;

  const converted = await convertToViewer(
    ctx,
    viewerCur,
    share,
    balanceCurrency(expense)
  );
  const monthStart = new Date(
    new Date(expense.date).getFullYear(),
    new Date(expense.date).getMonth(),
    1
  ).getTime();

  monthlyTotals[monthStart] = (monthlyTotals[monthStart] || 0) + converted;

  const buckets =
    monthlyCategoryTotals.get(monthStart) ?? emptyCategoryTotals();
  const categoryId = normalizeExpenseCategoryId(expense.category);
  buckets.set(categoryId, (buckets.get(categoryId) ?? 0) + converted);
  monthlyCategoryTotals.set(monthStart, buckets);
}

const result = Object.entries(monthlyTotals).map(([month, total]) => ({
  month: parseInt(month),
  total,
  byCategory: categoryTotalsToArray(
    monthlyCategoryTotals.get(parseInt(month)) ?? emptyCategoryTotals()
  ),
}));
```

Add `ExpenseCategoryId` type import from `./_lib/categories`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- tests/convex/dashboard-monthly-spending.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add convex/_lib/categories.ts convex/dashboard.ts tests/convex/dashboard-monthly-spending.test.ts
git commit -m "feat: add monthly spending breakdown by category"
```

---

### Task 3: Domain type update

**Files:**
- Modify: `lib/types/domain.ts`

- [ ] **Step 1: Extend MonthlySpendingItem**

```ts
export type MonthlySpendingItem = {
  month: number;
  total: number;
  byCategory: Array<{ categoryId: string; amount: number }>;
};
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: May surface errors in `expense-summary.tsx` until Task 4 — note and proceed.

- [ ] **Step 3: Commit**

```bash
git add lib/types/domain.ts
git commit -m "chore: extend MonthlySpendingItem with byCategory"
```

---

### Task 4: Stacked category chart on Etusivu

**Files:**
- Modify: `components/features/dashboard/expense-summary.tsx`

- [ ] **Step 1: Update chart data transform and stacked bars**

Key changes in `expense-summary.tsx`:

```tsx
import { useMemo } from "react";
import {
  CATEGORY_IDS,
  getCategoryColor,
} from "@/lib/expense-categories";
import { getCategoryLabel } from "@/lib/i18n/category-label";

// Inside component:
const tCategories = useTranslations("categories");

const chartData = useMemo(
  () =>
    monthlySpending?.map((item) => {
      const date = new Date(item.month);
      const monthKey = MONTH_KEYS[date.getMonth()];
      const row: Record<string, string | number> = {
        name: t(`monthShort.${monthKey}`),
        monthLabel: t(`monthShort.${monthKey}`),
        total: item.total,
      };
      for (const id of CATEGORY_IDS) {
        const match = item.byCategory?.find((c) => c.categoryId === id);
        row[id] = match?.amount ?? 0;
      }
      return row;
    }) ?? [],
  [monthlySpending, t]
);

const renderTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const nonZero = payload
    .filter((p) => typeof p.value === "number" && p.value > 0)
    .sort((a, b) => Number(b.value) - Number(a.value));
  const total = nonZero.reduce((sum, p) => sum + Number(p.value), 0);
  return (
    <div className="rounded-md border bg-background p-3 text-sm shadow-md">
      <p className="font-medium mb-2">{label}</p>
      <ul className="space-y-1">
        {nonZero.map((entry) => (
          <li key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: getCategoryColor(String(entry.dataKey)) }}
            />
            <span>{getCategoryLabel(tCategories, String(entry.dataKey))}</span>
            <span className="ml-auto tabular-nums">
              {format(Number(entry.value))}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t pt-2 font-medium tabular-nums">
        {tShared("sumLabel")}: {format(total)}
      </p>
    </div>
  );
};
```

Replace single `Bar` with:

```tsx
<div className="h-64 mt-6" data-testid="expense-summary-chart">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={chartData}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip content={renderTooltip} />
      {CATEGORY_IDS.map((id) => (
        <Bar
          key={id}
          dataKey={id}
          stackId="month"
          fill={getCategoryColor(id)}
          radius={id === CATEGORY_IDS[CATEGORY_IDS.length - 1] ? [4, 4, 0, 0] : undefined}
        />
      ))}
    </BarChart>
  </ResponsiveContainer>
</div>

<ul
  className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-4 text-xs text-muted-foreground"
  data-testid="expense-summary-legend"
>
  {CATEGORY_IDS.map((id) => (
    <li key={id} className="flex items-center gap-1">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: getCategoryColor(id) }}
      />
      {getCategoryLabel(tCategories, id)}
    </li>
  ))}
</ul>
```

Import `TooltipProps` from `recharts` for the tooltip typing.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/features/dashboard/expense-summary.tsx
git commit -m "feat: stacked category colors on dashboard expense chart"
```

---

### Task 5: Toiminta donut uses global palette

**Files:**
- Modify: `components/features/activity/spending-charts.tsx`

- [ ] **Step 1: Update categoryData and remove CHART_COLORS**

```tsx
import { getCategoryColor } from "@/lib/expense-categories";

// Remove CHART_COLORS constant entirely.

const categoryData = useMemo(() => {
  if (!summary) return [];
  return summary.byCategory.map((c) => ({
    categoryId: c.categoryId,
    name: getCategoryLabel(tCategories, c.categoryId),
    amount: c.amount,
  }));
}, [summary, tCategories]);

// Pie cells:
{categoryData.map((entry) => (
  <Cell
    key={entry.categoryId}
    fill={getCategoryColor(entry.categoryId)}
  />
))}

// Legend:
{categoryData.map((c) => (
  <li key={c.categoryId} className="flex items-center gap-1">
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ backgroundColor: getCategoryColor(c.categoryId) }}
    />
    {c.name}
  </li>
))}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/features/activity/spending-charts.tsx
git commit -m "feat: use global category colors in activity donut chart"
```

---

### Task 6: Category color dot in expense list

**Files:**
- Modify: `components/features/expenses/expense-list.tsx`

- [ ] **Step 1: Add color dot beside category label**

Add import:

```tsx
import { getCategoryColor } from "@/lib/expense-categories";
```

In the metadata row next to category name:

```tsx
<span className="flex items-center gap-1">
  <span
    className="inline-block h-2 w-2 rounded-full shrink-0"
    style={{ backgroundColor: getCategoryColor(categoryId) }}
    aria-hidden
  />
  {getCategoryLabel(tCategories, categoryId)}
</span>
```

Replace the plain `<span>{getCategoryLabel(...)}</span>`.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/features/expenses/expense-list.tsx
git commit -m "feat: show category color dot in expense list"
```

---

### Task 7: Documentation and verify

**Files:**
- Modify: `docs/PRODUCT_SENSE.md`
- Modify: `docs/FRONTEND.md`
- Modify: `docs/superpowers/specs/2026-06-08-kategoriavaerit-dashboard-design.md` (status)

- [ ] **Step 1: Update PRODUCT_SENSE.md dashboard bullet**

In section 8 (or dashboard list around line 134), change monthly spending chart description to:

```markdown
- **Kulutusyhteenveto** — monthly stacked bar chart by category (22 fixed colors); totals for current month and year.
```

- [ ] **Step 2: Update FRONTEND.md testid table**

Add row:

```markdown
| Dashboard expense summary | `expense-summary-chart`, `expense-summary-legend` |
```

- [ ] **Step 3: Mark spec status implemented-pending**

In spec file, set status line to: `**Status:** Approved — implementation in progress`

- [ ] **Step 4: Run full verify**

Run: `npm run verify`
Expected: lint, docs, typecheck, and all tests PASS

- [ ] **Step 5: Commit**

```bash
git add docs/PRODUCT_SENSE.md docs/FRONTEND.md docs/superpowers/specs/2026-06-08-kategoriavaerit-dashboard-design.md docs/superpowers/plans/2026-06-08-kategoriavaerit-dashboard.md
git commit -m "docs: category colors on dashboard chart"
```

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| 22 fixed colors in lib | Task 1 |
| getMonthlySpending byCategory | Task 2 |
| Stacked monthly chart + legend + tooltip | Task 4 |
| Toiminta donut same colors | Task 5 |
| Expense list color dot | Task 6 |
| Legacy Other normalization | Task 1 + 2 |
| PRODUCT_SENSE + FRONTEND docs | Task 7 |
| Unit + convex tests | Task 1 + 2 |

No gaps found.
