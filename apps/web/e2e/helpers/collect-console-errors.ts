import type { Page } from '@playwright/test';

/**
 * Collects `console.error` messages emitted by `page` for a smoke assertion.
 * Registers the listener immediately so nothing emitted during the caller's
 * next navigation is missed — read the returned array once that navigation
 * settles.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  return errors;
}
