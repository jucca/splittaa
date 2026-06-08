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
