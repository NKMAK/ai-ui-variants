import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.VARIANT_EVAL_PORT ?? 5173);

export default defineConfig({
  testDir: ".",
  testMatch: /variant-quality\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  expect: {
    timeout: 30_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `pnpm --filter demo-app exec vite --configLoader runner --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
