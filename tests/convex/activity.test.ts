import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import {
  createTestConvex,
  createTestUser,
  joinGroupAsUser,
} from "./helpers";

describe("activity", () => {
  const t = createTestConvex();

  it("returns recent expenses sorted newest first", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "act-a");
    const { asUser: asB, userId: userB } = await createTestUser(t, "act-b");

    const older = Date.now() - 86_400_000;
    const newer = Date.now();

    await asA.mutation(api.expenses.createExpense, {
      description: "Vanha lounas",
      amount: 20,
      date: older,
      paidByUserId: userA,
      splitType: "equal",
      splits: [
        { userId: userA, amount: 10, paid: true },
        { userId: userB, amount: 10, paid: false },
      ],
    });

    await asA.mutation(api.expenses.createExpense, {
      description: "Uusi lounas",
      amount: 30,
      date: newer,
      paidByUserId: userA,
      splitType: "equal",
      splits: [
        { userId: userA, amount: 15, paid: true },
        { userId: userB, amount: 15, paid: false },
      ],
    });

    const feed = await asA.query(api.activity.getRecentActivity, { limit: 10 });

    expect(feed.length).toBeGreaterThanOrEqual(2);
    expect(feed[0]?.title).toBe("Uusi lounas");
    expect(feed[0]?.amount).toBe(30);
    expect(feed.some((e) => e.subtitle.includes("act-b"))).toBe(true);
  });

  it("includes group expenses with group context", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "grp-a");
    const { asUser: asB, userId: userB } = await createTestUser(t, "grp-b");

    const { groupId } = await asA.mutation(api.contacts.createGroup, {
      name: "Retkiryhmä",
      members: [userB],
    });
    await joinGroupAsUser(t, asB, groupId, userB);

    await asA.mutation(api.expenses.createExpense, {
      description: "Majoitus",
      amount: 100,
      date: Date.now(),
      paidByUserId: userA,
      splitType: "equal",
      splits: [
        { userId: userA, amount: 50, paid: true },
        { userId: userB, amount: 50, paid: false },
      ],
      groupId,
    });

    const feed = await asA.query(api.activity.getRecentActivity, {});

    const row = feed.find((e) => e.title === "Majoitus");
    expect(row).toBeDefined();
    expect(row?.contextType).toBe("group");
    expect(row?.subtitle).toContain("Retkiryhmä");
    expect(row?.href).toBe(`/groups/${groupId}`);
  });

  it("getSpendingSummary returns only the user's split share", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "spend-a");
    const { userId: userB } = await createTestUser(t, "spend-b");

    const now = Date.now();

    await asA.mutation(api.expenses.createExpense, {
      description: "Oma kahvi",
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
      description: "Kauppa",
      amount: 40,
      category: "groceries",
      date: now,
      paidByUserId: userA,
      splitType: "equal",
      splits: [
        { userId: userA, amount: 20, paid: true },
        { userId: userB, amount: 20, paid: false },
      ],
    });

    const summary = await asA.query(api.activity.getSpendingSummary, {
      period: "month",
    });

    expect(summary.totalAmount).toBe(25);
    expect(summary.expenseCount).toBe(2);
    expect(summary.byCategory).toEqual(
      expect.arrayContaining([
        { categoryId: "coffee", amount: 5 },
        { categoryId: "groceries", amount: 20 },
      ])
    );
    expect(summary.byTime.some((b) => b.amount > 0)).toBe(true);
    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    ).getDate();
    expect(summary.byTime).toHaveLength(daysInMonth);
    expect(summary.byTime[0]?.label).toBe("1");
    expect(summary.byTime[daysInMonth - 1]?.label).toBe(String(daysInMonth));
  });

  it("getSpendingSummary excludes expenses outside the period", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "spend-old");

    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    await asA.mutation(api.expenses.createExpense, {
      description: "Vanha",
      amount: 100,
      date: lastYear.getTime(),
      paidByUserId: userA,
      splitType: "equal",
      splits: [{ userId: userA, amount: 100, paid: true }],
    });

    const summary = await asA.query(api.activity.getSpendingSummary, {
      period: "month",
    });

    expect(summary.totalAmount).toBe(0);
    expect(summary.expenseCount).toBe(0);
  });
});
