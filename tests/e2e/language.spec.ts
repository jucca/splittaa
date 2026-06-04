import { test, expect } from "@playwright/test";

test.describe("language switcher", () => {
  test("switches header to English on landing", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("language-switcher").click();
    await page.getByTestId("language-option-en").click();

    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /easiest way to split expenses/i })
    ).toBeVisible();
  });

  test("switches header back to Finnish", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("language-switcher").click();
    await page.getByTestId("language-option-en").click();
    await page.getByTestId("language-switcher").click();
    await page.getByTestId("language-option-fi").click();

    await expect(page.getByRole("button", { name: "Kirjaudu" })).toBeVisible();
  });
});
