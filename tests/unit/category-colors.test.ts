import { describe, expect, it } from "vitest";
import {
  CATEGORY_IDS,
  EXPENSE_CATEGORIES,
  getCategoryColor,
  normalizeCategoryId,
} from "@/lib/expense-categories";

describe("category colors", () => {
  it("has exactly 22 category ids", () => {
    expect(CATEGORY_IDS).toHaveLength(22);
  });

  it("assigns a unique hex color to every category", () => {
    const colors = CATEGORY_IDS.map((id) => EXPENSE_CATEGORIES[id].color);
    expect(new Set(colors).size).toBe(22);
    for (const color of colors) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("getCategoryColor returns the category color", () => {
    expect(getCategoryColor("travel")).toBe(EXPENSE_CATEGORIES.travel.color);
  });

  it("getCategoryColor falls back to other for unknown ids", () => {
    expect(getCategoryColor("nope")).toBe(EXPENSE_CATEGORIES.other.color);
    expect(getCategoryColor("Other")).toBe(EXPENSE_CATEGORIES.other.color);
  });

  it("normalizeCategoryId maps legacy Other to other", () => {
    expect(normalizeCategoryId("Other")).toBe("other");
    expect(normalizeCategoryId(undefined)).toBe("other");
    expect(normalizeCategoryId("coffee")).toBe("coffee");
    expect(normalizeCategoryId("bogus")).toBe("other");
  });
});
