import { resolve } from "path";

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    passWithNoTests: true,
    testTimeout: 15000,
    alias: [
      { find: "server-only", replacement: resolve(__dirname, "./src/test/mocks/server-only.ts") },
      { find: /^@\/server\/db$/, replacement: resolve(__dirname, "./src/test/mocks/db.ts") },
      { find: "@", replacement: resolve(__dirname, "./src") },
    ],
  },
});
