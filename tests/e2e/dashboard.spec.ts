import { test, expect } from "@playwright/test";

/**
 * Authenticated dashboard tests require Clerk + Convex (see docs/RELIABILITY.md).
 * Run locally with a saved storage state once auth.setup is configured.
 */
test.describe("dashboard", () => {
  test.skip(
    !process.env.E2E_CLERK_STORAGE,
    "Set E2E_CLERK_STORAGE to a Playwright storageState path"
  );

  test.use({
    storageState: process.env.E2E_CLERK_STORAGE,
  });

  test("shows balance summary when signed in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-balance")).toBeVisible({
      timeout: 30_000,
    });
  });
});
