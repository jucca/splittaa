import { describe, expect, it } from "vitest";
import { validateSplits, SPLIT_TOLERANCE } from "@/lib/money/validate-splits";

describe("validateSplits", () => {
  it("accepts splits within tolerance", () => {
    expect(
      validateSplits(100, [{ amount: 50 }, { amount: 50 }])
    ).toEqual({ ok: true });
  });

  it("accepts small floating-point drift", () => {
    expect(
      validateSplits(100, [
        { amount: 33.33 },
        { amount: 33.33 },
        { amount: 33.34 },
      ])
    ).toEqual({ ok: true });
  });

  it("rejects splits that do not sum to total", () => {
    expect(
      validateSplits(100, [{ amount: 40 }, { amount: 40 }])
    ).toEqual({ ok: false, code: "INVALID_SPLITS" });
  });

  it("accepts splits that sum within a wider tolerance", () => {
    expect(validateSplits(10, [{ amount: 9.7 }], 0.4)).toEqual({ ok: true });
  });

  it("rejects splits outside custom tolerance", () => {
    expect(validateSplits(10, [{ amount: 9.0 }], 0.4)).toEqual({
      ok: false,
      code: "INVALID_SPLITS",
    });
  });

  it("exports tolerance constant", () => {
    expect(SPLIT_TOLERANCE).toBe(0.01);
  });

  it("accepts zero total with empty splits", () => {
    expect(validateSplits(0, [])).toEqual({ ok: true });
  });
});
