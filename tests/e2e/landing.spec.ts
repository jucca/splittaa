import { test, expect } from "@playwright/test";

test.describe("landing page", () => {
  test("shows marketing headline and sign-in entry", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /jaa kulut/i })
    ).toBeVisible();

    await expect(page.getByRole("link", { name: /aloita/i })).toBeVisible();
  });
});
