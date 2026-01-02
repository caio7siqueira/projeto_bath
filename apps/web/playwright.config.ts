import { defineConfig, devices } from '@playwright/test';

const DEV_HOST = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1';
const DEV_PORT = process.env.PLAYWRIGHT_PORT ?? '3100';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${DEV_HOST}:${DEV_PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    testIdAttribute: 'data-testid',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: `http://${DEV_HOST}:${DEV_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: DEV_PORT,
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4311',
    },
  },
  workers: process.env.CI ? 2 : undefined,
});
