import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/web/e2e",
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "apps/web/.sisyphus/evidence/playwright-results.json" }],
    ["html", { outputFolder: "apps/web/playwright-report" }],
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || "https://crewcircle.co",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
