import { describe, expect, it } from "vitest";
import { validateSplits, SPLIT_TOLERANCE } from "../../convex/_lib/money";

describe("convex/_lib/money", () => {
  it("uses default tolerance constant", () => {
    expect(SPLIT_TOLERANCE).toBe(0.01);
  });

  it("rejects empty splits when total is positive", () => {
    expect(validateSplits(10, [])).toEqual({
      ok: false,
      code: "INVALID_SPLITS",
    });
  });

  it("accepts custom tolerance", () => {
    expect(validateSplits(10, [{ amount: 9.95 }], 0.1)).toEqual({ ok: true });
  });
});
