import { describe, expect, it } from "vitest";
import { expenseFormSchema } from "@/lib/validation/expense";

describe("expenseFormSchema", () => {
  const base = {
    description: "Lunch",
    amount: "12.50",
    date: new Date("2026-01-15"),
    paidByUserId: "user_123",
    splitType: "equal" as const,
  };

  it("accepts valid payload", () => {
    expect(expenseFormSchema.safeParse(base).success).toBe(true);
  });

  it("rejects empty description", () => {
    const result = expenseFormSchema.safeParse({ ...base, description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive amount", () => {
    expect(expenseFormSchema.safeParse({ ...base, amount: "0" }).success).toBe(
      false
    );
    expect(
      expenseFormSchema.safeParse({ ...base, amount: "not-a-number" }).success
    ).toBe(false);
  });

  it("rejects missing payer", () => {
    expect(
      expenseFormSchema.safeParse({ ...base, paidByUserId: "" }).success
    ).toBe(false);
  });

  it("rejects invalid split type", () => {
    expect(
      expenseFormSchema.safeParse({ ...base, splitType: "magic" }).success
    ).toBe(false);
  });

  it("accepts optional category and groupId", () => {
    expect(
      expenseFormSchema.safeParse({
        ...base,
        category: "foodDrink",
        groupId: "group_abc",
      }).success
    ).toBe(true);
  });

  it("accepts percentage and exact split types", () => {
    expect(
      expenseFormSchema.safeParse({ ...base, splitType: "percentage" }).success
    ).toBe(true);
    expect(
      expenseFormSchema.safeParse({ ...base, splitType: "exact" }).success
    ).toBe(true);
  });
});
