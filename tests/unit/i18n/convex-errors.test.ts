import { describe, expect, it } from "vitest";
import { mapConvexError } from "@/lib/i18n/convex-errors";

describe("mapConvexError", () => {
  it("returns Finnish message for known code", () => {
    expect(mapConvexError("FORBIDDEN", "fi")).toBe(
      "Ei oikeutta tähän toimintoon"
    );
  });

  it("returns English message for known code", () => {
    expect(mapConvexError("NOT_FOUND", "en")).toBe("Not found");
  });

  it("falls back when code unknown", () => {
    expect(mapConvexError(undefined, "en")).toBe("Unknown error");
  });
});
