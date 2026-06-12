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
      name: 'visual',
      testDir: 'tests/visual',
      use: { ...devices['Desktop Chrome'], baseURL: NEW_APP },
    },
    {
      // Captures golden-master fixtures from the legacy engine. Run via
      // `pnpm golden:capture` only when the legacy reference intentionally changes.
      name: 'golden-capture',
      testDir: 'tests/golden',
      use: { ...devices['Desktop Chrome'], baseURL: LEGACY_APP },
    },
  ],
  webServer: [
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
