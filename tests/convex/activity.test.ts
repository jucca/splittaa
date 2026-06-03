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
});
