import { afterEach, describe, expect, it } from "vitest";
import { getSiteUrl } from "@/lib/config/site-url";

describe("getSiteUrl", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("prefers NEXT_PUBLIC_APP_URL", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_APP_URL: "https://splittaa.fi/",
      VERCEL_URL: "preview.vercel.app",
    };
    expect(getSiteUrl()).toBe("https://splittaa.fi");
  });

  it("falls back to VERCEL_URL", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_APP_URL: "",
      VERCEL_URL: "my-app.vercel.app",
    };
    expect(getSiteUrl()).toBe("https://my-app.vercel.app");
  });

  it("defaults to localhost", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_APP_URL: "",
      VERCEL_URL: "",
    };
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
