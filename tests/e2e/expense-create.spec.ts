import { test, expect } from "@playwright/test";

test.describe("expense create", () => {
  test.skip(
    !process.env.E2E_CLERK_STORAGE,
    "Set E2E_CLERK_STORAGE to a Playwright storageState path"
  );

  test.use({
    storageState: process.env.E2E_CLERK_STORAGE,
  });

  test("expense form exposes submit control", async ({ page }) => {
    await page.goto("/expenses/new");
    await expect(page.getByTestId("expense-submit")).toBeVisible({
      timeout: 30_000,
    });
  });
});
