import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { createTestConvex, createTestUser, joinGroupAsUser } from "./helpers";

describe("global balance (Saldotiedot)", () => {
  const t = createTestConvex();

  async function seedPersonalDebt(
    asA: ReturnType<typeof createTestConvex>,
    asB: ReturnType<typeof createTestConvex>,
    userA: Awaited<ReturnType<typeof createTestUser>>["userId"],
    userB: Awaited<ReturnType<typeof createTestUser>>["userId"]
  ) {
    await asB.mutation(api.expenses.createExpense, {
      description: "Initial personal debt",
      amount: 40,
      date: Date.now(),
      paidByUserId: userB,
      splitType: "exact",
      splits: [
        { userId: userA, amount: 20, paid: false },
        { userId: userB, amount: 20, paid: true },
      ],
    });
  }

  it("nets group expense against personal debt when autoNetBalances is on", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "gb-a");
    const { asUser: asB, userId: userB } = await createTestUser(t, "gb-b");
    const { asUser: asC, userId: userC } = await createTestUser(t, "gb-c");

    const { groupId } = await asA.mutation(api.contacts.createGroup, {
      name: "Global balance trip",
      members: [userB, userC],
    });
    await joinGroupAsUser(t, asB, groupId, userB);
    await joinGroupAsUser(t, asC, groupId, userC);

    await seedPersonalDebt(asA, asB, userA, userB);

    let dashboard = await asA.query(api.dashboard.getUserBalances, {});
    expect(dashboard.youOwe).toBe(20);

    await asA.mutation(api.expenses.createExpense, {
      description: "Group dinner",
      amount: 30,
      date: Date.now(),
      paidByUserId: userA,
      splitType: "equal",
      splits: [
        { userId: userA, amount: 10, paid: true },
        { userId: userB, amount: 10, paid: false },
        { userId: userC, amount: 10, paid: false },
      ],
      groupId,
    });

    dashboard = await asA.query(api.dashboard.getUserBalances, {});
    expect(dashboard.youOwe).toBe(10);
  });

  it("nets personal expense against debt when autoNetBalances is on", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "gb-pa");
    const { asUser: asB, userId: userB } = await createTestUser(t, "gb-pb");

    await seedPersonalDebt(asA, asB, userA, userB);

    await asA.mutation(api.expenses.createExpense, {
      description: "Covers B share",
      amount: 10,
      date: Date.now(),
      paidByUserId: userA,
      splitType: "exact",
      splits: [
        { userId: userA, amount: 0, paid: true },
        { userId: userB, amount: 10, paid: false },
      ],
    });

    const dashboard = await asA.query(api.dashboard.getUserBalances, {});
    expect(dashboard.youOwe).toBe(10);
  });

  it("does not net group expense when autoNetBalances is off", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "gb-off-a");
    const { asUser: asB, userId: userB } = await createTestUser(t, "gb-off-b");
    const { asUser: asC, userId: userC } = await createTestUser(t, "gb-off-c");

    await asA.mutation(api.settings.updateBalanceSettings, {
      autoNetBalances: false,
    });

    const { groupId } = await asA.mutation(api.contacts.createGroup, {
      name: "No net group",
      members: [userB, userC],
    });
    await joinGroupAsUser(t, asB, groupId, userB);
    await joinGroupAsUser(t, asC, groupId, userC);

    await seedPersonalDebt(asA, asB, userA, userB);

    await asA.mutation(api.expenses.createExpense, {
      description: "Group dinner",
      amount: 30,
      date: Date.now(),
      paidByUserId: userA,
      splitType: "equal",
      splits: [
        { userId: userA, amount: 10, paid: true },
        { userId: userB, amount: 10, paid: false },
        { userId: userC, amount: 10, paid: false },
      ],
      groupId,
    });

    const dashboard = await asA.query(api.dashboard.getUserBalances, {});
    expect(dashboard.youOwe).toBe(20);
  });

  it("does not net personal expense when autoNetBalances is off", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "gb-off-pa");
    const { asUser: asB, userId: userB } = await createTestUser(t, "gb-off-pb");

    await asA.mutation(api.settings.updateBalanceSettings, {
      autoNetBalances: false,
    });

    await seedPersonalDebt(asA, asB, userA, userB);

    await asA.mutation(api.expenses.createExpense, {
      description: "Covers B share",
      amount: 10,
      date: Date.now(),
      paidByUserId: userA,
      splitType: "exact",
      splits: [
        { userId: userA, amount: 0, paid: true },
        { userId: userB, amount: 10, paid: false },
      ],
    });

    const dashboard = await asA.query(api.dashboard.getUserBalances, {});
    expect(dashboard.youOwe).toBe(20);
  });
});
