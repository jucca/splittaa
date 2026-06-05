import { describe, expect, it } from "vitest";
import { convertAmount } from "@/lib/money/convert";

const rates = {
  EUR: 1,
  GBP: 0.85,
  USD: 1.1,
  JPY: 160,
} as const;

describe("convertAmount", () => {
  it("returns same amount when currencies match", () => {
    expect(convertAmount(50, "EUR", "EUR", rates)).toBe(50);
  });

  it("converts EUR to GBP", () => {
    expect(convertAmount(100, "EUR", "GBP", rates)).toBe(85);
  });

  it("converts GBP to EUR", () => {
    expect(convertAmount(85, "GBP", "EUR", rates)).toBe(100);
  });

  it("converts across non-EUR pair via hub", () => {
    const gbp = convertAmount(100, "USD", "GBP", rates);
    expect(gbp).toBeCloseTo(77.27, 2);
  });
});
