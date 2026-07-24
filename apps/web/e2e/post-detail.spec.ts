import { expect, test } from '@playwright/test';

import { collectConsoleErrors } from './helpers/collect-console-errors';

/**
 * This repo has no fixed seeded post slug to rely on across environments —
 * the dev dataset is author-managed and may be empty (docs/DEPLOY.md) — so
 * this test discovers a real post link from the `/blog` archive instead of
 * hardcoding one. `routes.post` (@blog/config) renders post links as
 * `/blog/{slug}`; pagination links live under `/blog/page/{n}` and are
 * excluded from the match.
 */
test.describe('post detail page smoke', () => {
  test('renders a real post with a 200 response and no console errors', async ({
    page,
  }) => {
    await page.goto('/blog');

    const postLink = page
      .locator('a[href^="/blog/"]:not([href^="/blog/page/"])')
      .first();
    const postLinkCount = await postLink.count();
    test.skip(
      postLinkCount === 0,
      'No posts found on /blog — dataset is empty.',
    );

    const href = await postLink.getAttribute('href');
    if (!href) {
      throw new Error('Post link on /blog has no href attribute.');
    }

    const consoleErrors = collectConsoleErrors(page);
    const response = await page.goto(href);

    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
