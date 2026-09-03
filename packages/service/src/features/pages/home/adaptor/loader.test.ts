import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawHomePage } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

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

const tenant = makeTenant();

describe('getHomePage', () => {
  it('maps the thin page_home document to module refs', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawHomePage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    const page = await getHomePage(tenant);
    if (!page) throw new Error('expected a home page');

    expect(page.title).toBe('Home Page');
    expect(page.hero).toEqual({
      id: 'hero-1',
      type: 'module_hero',
    });
    expect(page.modules).toEqual([
      { id: 'post-latest-1', type: 'module_postLatest' },
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

    const page = await getHomePage(tenant);
    if (!page) throw new Error('expected a home page');

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

    const page = await getHomePage(tenant);
    if (!page) throw new Error('expected a home page');

    expect(page.seo.title).toBe('Home');
    expect(page.seo.ogTitle).toBe('Home');
  });

  it('resolves undefined, rather than rejecting, when no page_home document exists', async () => {
    mockRun.mockResolvedValueOnce(null);

    const page = await getHomePage(tenant);

    expect(page).toBeUndefined();
  });

  it('does not fetch site settings when no page_home document exists', async () => {
    mockRun.mockResolvedValueOnce(null);

    await getHomePage(tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context into both queries and scopes their tags to it', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawHomePage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getHomePage(tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:homePage'] }),
      }),
    );
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:site-settings'] }),
      }),
    );
  });
});
