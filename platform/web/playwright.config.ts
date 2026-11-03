import { defineConfig } from "@playwright/test";

/**
 * Flow harness for the static demo. Chrome (the installed browser) drives
 * the real UI against the in-browser backend. Screenshots are evidence for
 * a model review; they are not pixel-compared.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: "e2e/results",
  use: {
    baseURL: "http://127.0.0.1:5175/demo/",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "en-GB",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev:demo",
    url: "http://127.0.0.1:5175/demo/",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
