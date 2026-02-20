import { test, expect } from "./fixtures/auth";

test.describe("Smoke tests", () => {
  test("dashboard loads with KPI cards", async ({ authenticatedPage: page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main")).toBeVisible();
    const cards = page.locator("[class*='card']");
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  });

  test("contacts page shows table", async ({ authenticatedPage: page }) => {
    await page.goto("/contacts");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });
  });

  test("companies page shows table", async ({ authenticatedPage: page }) => {
    await page.goto("/companies");
    await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });
  });

  test("deals page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
  });

  test("settings page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
  });

  test("navigate to contact detail from list", async ({ authenticatedPage: page }) => {
    await page.goto("/contacts");
    await page.waitForLoadState("networkidle");
    const firstLink = page.getByRole("link", { name: /.*/ }).first();
    const href = await firstLink.getAttribute("href");
    if (href?.startsWith("/contacts/")) {
      await firstLink.click();
      await expect(page).toHaveURL(/\/contacts\/[0-9a-f-]{36}/);
    }
  });

  test("navigate to company detail from list", async ({ authenticatedPage: page }) => {
    await page.goto("/companies");
    await page.waitForLoadState("networkidle");
    const firstLink = page.getByRole("link", { name: /.*/ }).first();
    const href = await firstLink.getAttribute("href");
    if (href?.startsWith("/companies/")) {
      await firstLink.click();
      await expect(page).toHaveURL(/\/companies\/[0-9a-f-]{36}/);
    }
  });

  test("Cmd+K search opens dialog", async ({ authenticatedPage: page }) => {
    await page.goto("/");
    await page.keyboard.press("Meta+k");
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
  });
});
