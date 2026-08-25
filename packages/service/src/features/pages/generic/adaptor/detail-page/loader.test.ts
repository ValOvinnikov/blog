import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawGenericPage } from '@blog/service/testing/pages/fixtures';

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
    if (!page) throw new Error('expected a generic page');

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
    if (!page) throw new Error('expected a generic page');

    expect(page.seo.title).toBe('About');
    expect(page.seo.description).toBe('Settings description');
    expect(page.seo.ogImageUrl).toContain('sanity.io');
  });

  it('lets authored seo override the resolved defaults', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawGenericPage({
          seo: {
            metaTitle: 'About Us',
            metaDescription: null,
            openGraph: null,
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const page = await getPage('about');
    if (!page) throw new Error('expected a generic page');

    expect(page.seo.title).toBe('About Us');
    expect(page.seo.ogTitle).toBe('About Us');
  });

  it('resolves undefined, rather than rejecting, when no page_generic matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const page = await getPage('missing');

    expect(page).toBeUndefined();
  });

  it('does not fetch site settings when no page_generic matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    await getPage('missing');

    expect(mockRun).toHaveBeenCalledTimes(1);
  });
});
