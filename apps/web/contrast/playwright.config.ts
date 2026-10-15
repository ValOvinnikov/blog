import { defineConfig, devices } from '@playwright/test';

import { STORYBOOK_ORIGIN } from './helpers/storybook-static';

export default defineConfig({
  testDir: '.',
  outputDir: '../test-results/contrast',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['dot']] : 'list',
  timeout: 180_000,
  globalTeardown: './helpers/merge-baseline-parts.ts',
  use: {
    baseURL: STORYBOOK_ORIGIN,
    // For a machine whose installed Chromium isn't the build this Playwright version expects.
    launchOptions: {
      executablePath: process.env.CONTRAST_CHROMIUM_PATH || undefined,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 },
    },
  ],
});
