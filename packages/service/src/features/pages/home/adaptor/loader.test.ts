import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawHomePage } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getHomePage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getHomePage', () => {
  it('maps the thin page_home document to module refs', async () => {
    mockRun.mockResolvedValueOnce(makeRawHomePage());

    const page = await getHomePage();

    expect(page.title).toBe('Home Page');
    expect(page.hero).toEqual({
      key: 'hero-ref',
      id: 'hero-1',
      type: 'module_hero',
    });
    expect(page.modules).toEqual([
      { key: 'module-1', id: 'post-list-1', type: 'module_postList' },
      { key: 'module-2', id: 'cta-1', type: 'module_cta' },
    ]);
    expect(page.seo).toBeUndefined();
  });

  it('maps seo when present', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHomePage({
        seo: { metaTitle: 'Home', metaDescription: null, openGraph: null },
      }),
    );

    const page = await getHomePage();

    expect(page.seo).toEqual({
      metaTitle: 'Home',
      metaDescription: undefined,
      ogTitle: undefined,
      ogDescription: undefined,
      ogImageUrl: undefined,
    });
  });

  it('propagates when the home page document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getHomePage()).rejects.toThrow();
  });
});
