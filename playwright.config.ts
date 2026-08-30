import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: `${baseURL}/admin/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
