export const SPLIT_TOLERANCE = 0.01;

export type SplitAmount = { amount: number };

export type ValidateSplitsResult =
  | { ok: true }
  | { ok: false; code: "INVALID_SPLITS" };

export function validateSplits(
  total: number,
  splits: SplitAmount[],
  tolerance = SPLIT_TOLERANCE
): ValidateSplitsResult {
  const sum = splits.reduce((acc, split) => acc + split.amount, 0);
  if (Math.abs(sum - total) > tolerance) {
    return { ok: false, code: "INVALID_SPLITS" };
  }
  return { ok: true };
}
