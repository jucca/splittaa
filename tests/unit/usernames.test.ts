import { describe, expect, it } from "vitest";
import {
  normalizeUsername,
  validateUsername,
  slugifyUsernameSuggestion,
  isReservedUsername,
  USERNAME_CHANGE_COOLDOWN_MS,
} from "@/lib/usernames";

describe("usernames", () => {
  it("normalizes to lowercase and strips @", () => {
    expect(normalizeUsername("@Jukka_42")).toBe("jukka_42");
  });

  it("validates allowed format", () => {
    expect(validateUsername("ab")).toEqual({ ok: false, code: "TOO_SHORT" });
    expect(validateUsername("jukka")).toEqual({ ok: true });
    expect(validateUsername("Jukka!")).toEqual({
      ok: false,
      code: "INVALID_CHARS",
    });
  });

  it("rejects reserved usernames", () => {
    expect(isReservedUsername("admin")).toBe(true);
    expect(isReservedUsername("jukka")).toBe(false);
  });

  it("slugifies finnish names", () => {
    expect(slugifyUsernameSuggestion("Jukka Virtanen")).toBe("jukka_virtanen");
    expect(slugifyUsernameSuggestion("Päivi Åström")).toBe("paivi_astrom");
  });

  it("exports 30-day cooldown constant", () => {
    expect(USERNAME_CHANGE_COOLDOWN_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
