import { describe, expect, it } from "vitest";
import { computeGoalProgress } from "@/lib/workspace-goals";

describe("computeGoalProgress", () => {
  it("computes budget cap from spent total", () => {
    const result = computeGoalProgress({
      type: "budget_cap",
      targetAmount: 1000,
      spentTotal: 250,
    });
    expect(result.current).toBe(250);
    expect(result.percent).toBe(25);
    expect(result.remaining).toBe(750);
  });

  it("computes savings target from deposits", () => {
    const result = computeGoalProgress({
      type: "savings_target",
      targetAmount: 500,
      depositedTotal: 125,
    });
    expect(result.current).toBe(125);
    expect(result.percent).toBe(25);
    expect(result.remaining).toBe(375);
  });

  it("caps percent at 100", () => {
    const result = computeGoalProgress({
      type: "budget_cap",
      targetAmount: 100,
      spentTotal: 200,
    });
    expect(result.percent).toBe(100);
    expect(result.remaining).toBe(0);
  });
});
