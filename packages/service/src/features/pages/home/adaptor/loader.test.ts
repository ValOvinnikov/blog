import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawHomePage } from '@blog/service/testing/pages/fixtures';

import { getHomePage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
  ),
}));

describe('getHomePage', () => {
  it('maps the thin page_home document to module refs', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawHomePage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    const page = await getHomePage();

    expect(page.title).toBe('Home Page');
    expect(page.hero).toEqual({
      id: 'hero-1',
      type: 'module_hero',
    });
    expect(page.modules).toEqual([
      { id: 'post-list-1', type: 'module_postList' },
      { id: 'cta-1', type: 'module_cta' },
    ]);
  });

  it('resolves seo from site settings when the page has no authored seo', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawHomePage({ seo: null }))
      .mockResolvedValueOnce(
        makeRawSiteSettings({
          description: 'Settings description',
        }),
      );

    const page = await getHomePage();

    expect(page.seo.title).toBe('My Blog');
    expect(page.seo.description).toBe('Settings description');
    expect(page.seo.ogImageUrl).toContain('sanity.io');
  });

  it('lets authored seo override the resolved defaults', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawHomePage({
          seo: { metaTitle: 'Home', metaDescription: null, openGraph: null },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const page = await getHomePage();

    expect(page.seo.title).toBe('Home');
    expect(page.seo.ogTitle).toBe('Home');
  });

  it('propagates when the home page document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getHomePage()).rejects.toThrow();
  });
});
