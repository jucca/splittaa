import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { createTestConvex, createTestUser, expectConvexError } from "./helpers";

describe("settlements", () => {
  const t = createTestConvex();

  it("rejects settlement when payer is not in group", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "jane");
    const { userId: userB } = await createTestUser(t, "kyle");
    const { asUser: asC, userId: userC } = await createTestUser(t, "liam");

    const groupId = await asA.mutation(api.contacts.createGroup, {
      name: "Trip",
      members: [userB],
    });

    try {
      await asC.mutation(api.settlements.createSettlement, {
        amount: 10,
        paidByUserId: userC,
        receivedByUserId: userB,
        groupId,
      });
      expect.fail("should throw");
    } catch (error) {
      expectConvexError(error, "FORBIDDEN");
    }
  });

  it("allows settlement between group members", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "maya");
    const { userId: userB } = await createTestUser(t, "noah");

    const groupId = await asA.mutation(api.contacts.createGroup, {
      name: "Ski trip",
      members: [userB],
    });

    const id = await asA.mutation(api.settlements.createSettlement, {
      amount: 25,
      paidByUserId: userA,
      receivedByUserId: userB,
      groupId,
    });

    expect(id).toBeTruthy();
  });

  it("reduces personal snapshot balance when settlement is recorded", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "olivia");
    const { asUser: asB, userId: userB } = await createTestUser(t, "peter");

    await asA.mutation(api.expenses.createExpense, {
      description: "Concert tickets",
      amount: 80,
      date: Date.now(),
      paidByUserId: userA,
      splitType: "exact",
      splits: [
        { userId: userA, amount: 40, paid: true },
        { userId: userB, amount: 40, paid: false },
      ],
    });

    await asB.mutation(api.settlements.createSettlement, {
      amount: 15,
      paidByUserId: userB,
      receivedByUserId: userA,
    });

    const aBalances = await asA.query(api.balances.getPersonalBalances, {});
    const bBalances = await asB.query(api.balances.getPersonalBalances, {});
    expect(aBalances.find((x) => x.userId === userB)?.netBalance).toBe(25);
    expect(bBalances.find((x) => x.userId === userA)?.netBalance).toBe(-25);
  });
});
