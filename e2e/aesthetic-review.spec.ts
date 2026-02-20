import { test, expect } from "./fixtures/gemini-fixture";

const PAGES_TO_REVIEW = [
  {
    name: "Dashboard",
    path: "/",
    context: "Dashboard con KPI cards, grafico deals per stage, deals stagnanti",
  },
  {
    name: "Contacts",
    path: "/contacts",
    context: "Lista contatti con tabella, filtri di ricerca, paginazione",
  },
  { name: "Companies", path: "/companies", context: "Lista aziende con tabella e filtri" },
  { name: "Deals Pipeline", path: "/deals", context: "Pipeline deals con kanban board e tabella" },
];

test.describe("UI Aesthetic Review (Gemini Vision)", () => {
  test.describe.configure({ mode: "serial" });

  for (const { name, path, context } of PAGES_TO_REVIEW) {
    test(`${name} passes visual aesthetic review`, async ({
      authenticatedPage: page,
      reviewScreenshot,
    }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const screenshot = await page.screenshot({ fullPage: true });

      const { pass, feedback } = await reviewScreenshot(screenshot, context);
      console.log(`[Gemini] ${name}: ${feedback}`);

      expect(pass, `Gemini found UI issues on ${name}:\n${feedback}`).toBe(true);
    });
  }
});
