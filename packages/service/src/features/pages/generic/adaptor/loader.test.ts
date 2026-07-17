import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawGenericPage } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
  ),
}));

describe('getPage', () => {
  it('maps the thin page_generic document to module refs', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawGenericPage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    const page = await getPage('about');

    expect(page.title).toBe('About');
    expect(page.slug).toBe('about');
    expect(page.modules).toEqual([
      { id: 'content-1', type: 'module_content' },
      { id: 'cta-1', type: 'module_cta' },
    ]);
  });

  it('resolves seo from the page title and site settings when the page has no authored seo', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawGenericPage({ seo: null }))
      .mockResolvedValueOnce(
        makeRawSiteSettings({
          description: 'Settings description',
        }),
      );

    const page = await getPage('about');

    expect(page.seo.title).toBe('About');
    expect(page.seo.description).toBe('Settings description');
    expect(page.seo.ogImageUrl).toContain('sanity.io');
  });

  it('lets authored seo override the resolved defaults', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawGenericPage({
          seo: { metaTitle: 'About Us', metaDescription: null, openGraph: null },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const page = await getPage('about');

    expect(page.seo.title).toBe('About Us');
    expect(page.seo.ogTitle).toBe('About Us');
  });

  it('propagates when the page document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPage('missing')).rejects.toThrow();
  });
});
