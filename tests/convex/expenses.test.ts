import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  createTestConvex,
  createTestUser,
  expectConvexError,
  joinGroupAsUser,
} from "./helpers";

describe("expenses", () => {
  const t = createTestConvex();

  it("rejects group expense when caller is not a group member", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "alice");
    const { userId: userB } = await createTestUser(t, "bob");
    const { asUser: asC, userId: userC } = await createTestUser(t, "carol");

    const { groupId } = await asA.mutation(api.contacts.createGroup, {
      name: "Test group",
      members: [userB],
    });

    try {
      await asC.mutation(api.expenses.createExpense, {
        description: "Unauthorized group expense",
        amount: 50,
        date: Date.now(),
        paidByUserId: userC,
        splitType: "equal",
        splits: [
          { userId: userA, amount: 25, paid: false },
          { userId: userB, amount: 25, paid: false },
        ],
        groupId,
      });
      expect.fail("should throw");
    } catch (error) {
      expectConvexError(error, "FORBIDDEN");
    }
  });

  it("rejects expense when splits do not sum to total", async () => {
    const { asUser, userId } = await createTestUser(t, "dave");

    await expect(
      asUser.mutation(api.expenses.createExpense, {
        description: "Bad splits",
        amount: 100,
        date: Date.now(),
        paidByUserId: userId,
        splitType: "equal",
        splits: [{ userId, amount: 40, paid: true }],
      })
    ).rejects.toThrow(/Jaettujen summien/);
  });

  it("allows member to create a valid group expense", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "erin");
    const { asUser: asB, userId: userB } = await createTestUser(t, "frank");

    const { groupId } = await asA.mutation(api.contacts.createGroup, {
      name: "Roommates",
      members: [userB],
    });

    await joinGroupAsUser(t, asB, groupId, userB);

    const expenseId = await asA.mutation(api.expenses.createExpense, {
      description: "Rent share",
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

    expect(expenseId).toBeTruthy();
  });

  it("rejects deleteExpense from unrelated user", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "gina");
    const { asUser: asB, userId: userB } = await createTestUser(t, "henry");

    const expenseId = await asA.mutation(api.expenses.createExpense, {
      description: "Private lunch",
      amount: 30,
      date: Date.now(),
      paidByUserId: userA,
      splitType: "equal",
      splits: [
        { userId: userA, amount: 15, paid: true },
        { userId: userB, amount: 15, paid: false },
      ],
    });

    await expect(
      asB.mutation(api.expenses.deleteExpense, {
        expenseId: expenseId as Id<"expenses">,
      })
    ).rejects.toThrow(/ei ole oikeutta/);
  });

  it("rejects getExpensesBetweenUsers for self", async () => {
    const { asUser, userId } = await createTestUser(t, "iris");

    await expect(
      asUser.query(api.expenses.getExpensesBetweenUsers, { userId })
    ).rejects.toThrow(/itsestäsi/);
  });

  it("updates personal balance snapshot on create and delete", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "jill");
    const { asUser: asB, userId: userB } = await createTestUser(t, "kate");

    const expenseId = await asA.mutation(api.expenses.createExpense, {
      description: "Dinner",
      amount: 60,
      date: Date.now(),
      paidByUserId: userA,
      splitType: "exact",
      splits: [
        { userId: userA, amount: 30, paid: true },
        { userId: userB, amount: 30, paid: false },
      ],
    });

    const aBalances = await asA.query(api.balances.getPersonalBalances, {});
    const bBalances = await asB.query(api.balances.getPersonalBalances, {});
    expect(aBalances.find((x) => x.userId === userB)?.netBalance).toBe(30);
    expect(bBalances.find((x) => x.userId === userA)?.netBalance).toBe(-30);

    await asA.mutation(api.expenses.deleteExpense, {
      expenseId: expenseId as Id<"expenses">,
    });

    const aAfterDelete = await asA.query(api.balances.getPersonalBalances, {});
    const bAfterDelete = await asB.query(api.balances.getPersonalBalances, {});
    expect(aAfterDelete.find((x) => x.userId === userB)).toBeUndefined();
    expect(bAfterDelete.find((x) => x.userId === userA)).toBeUndefined();
  });
});
