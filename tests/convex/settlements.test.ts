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
});
