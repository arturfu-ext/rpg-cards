import { defineConfig, devices } from '@playwright/test';

const NEW_APP = 'http://127.0.0.1:4173/rpg-cards/';
const LEGACY_APP = 'http://127.0.0.1:8080/';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'e2e',
      testDir: 'tests/e2e',
      use: { ...devices['Desktop Chrome'], baseURL: NEW_APP },
    },
    {
      // Serial: shares the fixed-port :8081 icon-origin server across tests,
      // and pixel comparisons are more stable without worker contention.
      name: 'visual',
      testDir: 'tests/visual',
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], baseURL: NEW_APP },
    },
    {
      // Captures golden-master fixtures from the legacy engine. Run via
      // `pnpm golden:capture` only when the legacy reference intentionally changes.
      // Serial: every worker would otherwise spawn/kill the shared :8081 server
      // (the origin is baked into fixture data-src URLs, so the port is fixed).
      name: 'golden-capture',
      testDir: 'tests/golden',
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], baseURL: LEGACY_APP },
    },
  ],
  // golden-capture manages its own static server (see tests/golden/capture.spec.ts)
  // and must not depend on the app building mid-migration.
  webServer: process.argv.some((arg) => arg.includes('golden-capture'))
    ? []
    : [
        {
          command: 'pnpm build && pnpm preview --port 4173 --strictPort',
          url: NEW_APP,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
        {
          command: 'pnpm legacy:start',
          url: `${LEGACY_APP}index.html`,
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
      ],
});
