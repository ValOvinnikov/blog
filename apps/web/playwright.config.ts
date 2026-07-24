import { defineConfig, devices } from '@playwright/test';

/**
 * Minimal Playwright smoke config (#275). The suite in `e2e/` runs a tiny
 * set of checks (home render + one real post-detail render, both asserting a
 * 200 response and zero console errors) against a real, already-deployed
 * `SMOKE_URL` — a Vercel preview or the dev/production site — never a
 * locally built app in CI. This repo has no per-PR preview deploys
 * (`apps/web/vercel.json`'s `git.deploymentEnabled: false`; see SPEC.md §13
 * and `.github/workflows/playwright-smoke.yml`), so there's deliberately no
 * `webServer` entry here — point `SMOKE_URL` at whatever origin should be
 * smoke-tested, local or remote.
 *
 * Local run: start a dev server in one terminal (`pnpm --filter web dev`),
 * then in another: `SMOKE_URL=http://localhost:3000 pnpm --filter web test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: process.env.SMOKE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
