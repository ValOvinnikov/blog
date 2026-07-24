import { expect, test } from '@playwright/test';

import { collectConsoleErrors } from './helpers/collect-console-errors';

test.describe('home page smoke', () => {
  test('renders with a 200 response and no console errors', async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);

    const response = await page.goto('/');

    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
