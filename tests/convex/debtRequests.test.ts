import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import {
  createTestConvex,
  createTestUser,
  expectConvexError,
} from "./helpers";

describe("debtRequests", () => {
  const t = createTestConvex();

  it("sends debt request when counterparty owes creditor", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "creditor");
    const { asUser: asB, userId: userB } = await createTestUser(t, "debtor");

    await asA.mutation(api.expenses.createExpense, {
      description: "Lounas",
      amount: 40,
      date: Date.now(),
      paidByUserId: userA,
      splitType: "equal",
      splits: [
        { userId: userA, amount: 20, paid: true },
        { userId: userB, amount: 20, paid: false },
      ],
    });

    const result = await asA.mutation(api.debtRequests.sendDebtRequest, {
      debtorUserId: userB,
    });
    expect(result.amount).toBe(20);

    const inbox = await asB.query(api.notifications.listMyNotifications, {});
    const debtMsg = inbox.find((m) => m.type === "debt_request");
    expect(debtMsg?.title).toBe("Velkapyyntö");
    expect(debtMsg?.body).toContain("creditor");
    expect(debtMsg?.href).toBe(`/person/${userA}`);
  });

  it("rejects debt request when no debt exists", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "even-a");
    const { userId: userB } = await createTestUser(t, "even-b");

    try {
      await asA.mutation(api.debtRequests.sendDebtRequest, {
        debtorUserId: userB,
      });
      expect.fail("should throw");
    } catch (error) {
      expectConvexError(error, "INVALID_STATE");
    }
  });

  it("respondToDebtRequest records settlement and notifies creditor", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "cred-a");
    const { asUser: asB, userId: userB } = await createTestUser(t, "cred-b");

    await asA.mutation(api.expenses.createExpense, {
      description: "Illallinen",
      amount: 60,
      date: Date.now(),
      paidByUserId: userA,
      splitType: "equal",
      splits: [
        { userId: userA, amount: 30, paid: true },
        { userId: userB, amount: 30, paid: false },
      ],
    });

    await asA.mutation(api.debtRequests.sendDebtRequest, {
      debtorUserId: userB,
    });

    const inboxB = await asB.query(api.notifications.listMyNotifications, {});
    const debtMsg = inboxB.find((m) => m.type === "debt_request");
    expect(debtMsg?.canMarkPaid).toBe(true);

    const result = await asB.mutation(api.debtRequests.respondToDebtRequest, {
      notificationId: debtMsg!.id,
    });
    expect(result.amount).toBe(30);

    const balance = await asB.query(api.expenses.getExpensesBetweenUsers, {
      userId: userA,
    });
    expect(balance.balance).toBe(0);

    const inboxA = await asA.query(api.notifications.listMyNotifications, {});
    expect(inboxA.some((m) => m.type === "debt_request_paid")).toBe(true);

    const inboxBAfter = await asB.query(api.notifications.listMyNotifications, {});
    const responded = inboxBAfter.find((m) => m.id === debtMsg!.id);
    expect(responded?.debtRequestRespondedAt).toBeTruthy();
    expect(responded?.canMarkPaid).toBe(false);
  });

  it("sendDebtRequestsBulk sends to all personal debtors", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "bulk-a");
    const { asUser: asB, userId: userB } = await createTestUser(t, "bulk-b");
    const { asUser: asC, userId: userC } = await createTestUser(t, "bulk-c");

    for (const [debtor, amount] of [
      [userB, 20],
      [userC, 30],
    ] as const) {
      await asA.mutation(api.expenses.createExpense, {
        description: "Jaettu",
        amount: amount * 2,
        date: Date.now(),
        paidByUserId: userA,
        splitType: "equal",
        splits: [
          { userId: userA, amount, paid: true },
          { userId: debtor, amount, paid: false },
        ],
      });
    }

    const result = await asA.mutation(api.debtRequests.sendDebtRequestsBulk, {
      message: "Muistutus",
    });
    expect(result.sent).toBe(2);
    expect(result.skippedCooldown).toBe(0);

    const inboxB = await asB.query(api.notifications.listMyNotifications, {});
    const inboxC = await asC.query(api.notifications.listMyNotifications, {});
    expect(inboxB.some((m) => m.type === "debt_request")).toBe(true);
    expect(inboxC.some((m) => m.type === "debt_request")).toBe(true);
  });

  it("enforces cooldown for repeated requests same day", async () => {
    const { asUser: asA, userId: userA } = await createTestUser(t, "repeat-a");
    const { userId: userB } = await createTestUser(t, "repeat-b");

    await asA.mutation(api.expenses.createExpense, {
      description: "Kahvi",
      amount: 10,
      date: Date.now(),
      paidByUserId: userA,
      splitType: "equal",
      splits: [
        { userId: userA, amount: 5, paid: true },
        { userId: userB, amount: 5, paid: false },
      ],
    });

    await asA.mutation(api.debtRequests.sendDebtRequest, {
      debtorUserId: userB,
    });

    try {
      await asA.mutation(api.debtRequests.sendDebtRequest, {
        debtorUserId: userB,
      });
      expect.fail("should throw");
    } catch (error) {
      expectConvexError(error, "COOLDOWN");
    }
  });
});
