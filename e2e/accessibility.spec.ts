import { test, expect } from "./fixtures/axe-fixture";

const PAGES = [
  { name: "Dashboard", path: "/" },
  { name: "Contacts", path: "/contacts" },
  { name: "Companies", path: "/companies" },
  { name: "Deals", path: "/deals" },
  { name: "Settings", path: "/settings" },
];

for (const { name, path } of PAGES) {
  test(`${name} page has no WCAG AA violations`, async ({
    authenticatedPage: page,
    makeAxeBuilder,
  }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const results = await makeAxeBuilder().analyze();

    if (results.violations.length > 0) {
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      }));
      console.log(`[a11y] ${name} violations:`, JSON.stringify(summary, null, 2));
    }

    expect(results.violations).toEqual([]);
  });
}
