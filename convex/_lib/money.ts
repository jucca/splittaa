/** Server-side copy of lib/money/validate-splits (Convex cannot import @/lib). */

export const SPLIT_TOLERANCE = 0.01;

export function validateSplits(
  total: number,
  splits: { amount: number }[],
  tolerance = SPLIT_TOLERANCE
): { ok: true } | { ok: false; code: "INVALID_SPLITS" } {
  const sum = splits.reduce((acc, split) => acc + split.amount, 0);
  if (Math.abs(sum - total) > tolerance) {
    return { ok: false, code: "INVALID_SPLITS" };
  }
  return { ok: true };
}
