export type WorkspaceGoalType = "budget_cap" | "savings_target";

export type GoalProgressInput = {
  type: WorkspaceGoalType;
  targetAmount: number;
  spentTotal?: number;
  depositedTotal?: number;
};

export function computeGoalProgress(input: GoalProgressInput): {
  current: number;
  percent: number;
  remaining: number;
} {
  const current =
    input.type === "budget_cap"
      ? (input.spentTotal ?? 0)
      : (input.depositedTotal ?? 0);

  const target = Math.max(input.targetAmount, 0);
  const percent =
    target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  const remaining =
    input.type === "budget_cap"
      ? Math.max(0, target - current)
      : Math.max(0, target - current);

  return { current, percent, remaining };
}
