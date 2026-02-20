import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${String(PORT)}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  outputDir: "test-results/",
  reporter: "html",

  webServer: {
    command: "pnpm build && pnpm start",
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env["CI"],
  },

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
