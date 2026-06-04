import { describe, expect, it } from "vitest";
import {
  localeFromPathname,
  stripLocalePrefix,
} from "@/lib/i18n/strip-locale-prefix";

describe("stripLocalePrefix", () => {
  it("removes /en prefix", () => {
    expect(stripLocalePrefix("/en")).toBe("/");
    expect(stripLocalePrefix("/en/dashboard")).toBe("/dashboard");
  });

  it("removes /fi prefix", () => {
    expect(stripLocalePrefix("/fi/asetukset")).toBe("/asetukset");
  });

  it("leaves normal paths unchanged", () => {
    expect(stripLocalePrefix("/dashboard")).toBe("/dashboard");
  });
});

describe("localeFromPathname", () => {
  it("reads locale segment", () => {
    expect(localeFromPathname("/en")).toBe("en");
    expect(localeFromPathname("/dashboard")).toBeNull();
  });
});
