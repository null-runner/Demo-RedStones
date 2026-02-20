import type { Page } from "@playwright/test";
import { test as base, expect } from "@playwright/test";

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: /esplora in demo mode/i }).click();
    await page.waitForURL("/");
    await expect(page.locator("[data-testid='sidebar'], nav")).toBeVisible({ timeout: 10_000 });
    await use(page);
  },
});

export { expect } from "@playwright/test";
