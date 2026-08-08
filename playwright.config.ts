import { defineConfig, devices } from '@playwright/test';

/**
 * E2E suite runs against an isolated instance (.e2e-data) on port 3100.
 * The `setup` project seeds it (admin, published course, news) and every
 * viewport project depends on it.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
    // The suite asserts against the Spanish UI.
    locale: 'es-ES',
    extraHTTPHeaders: { 'Accept-Language': 'es-ES,es;q=0.9' },
  },
  webServer: {
    command: 'OK_DATA_DIR=.e2e-data PORT=3100 pnpm dev',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /seed\.setup\.ts/,
    },
    {
      name: 'mobile',
      dependencies: ['setup'],
      testIgnore: /seed\.setup\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'tablet',
      dependencies: ['setup'],
      testIgnore: /seed\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
      },
    },
    {
      name: 'desktop',
      dependencies: ['setup'],
      testIgnore: /seed\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
