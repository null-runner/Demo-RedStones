import AxeBuilder from "@axe-core/playwright";

import { test as authTest } from "./auth";

type AxeFixture = {
  makeAxeBuilder: () => AxeBuilder;
};

export const test = authTest.extend<AxeFixture>({
  makeAxeBuilder: async ({ authenticatedPage }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page: authenticatedPage }).withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
      ]);
    await use(makeAxeBuilder);
  },
});

export { expect } from "@playwright/test";
