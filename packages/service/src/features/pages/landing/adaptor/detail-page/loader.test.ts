import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawLandingPage } from '@blog/service/testing/pages/fixtures';
import { makeRawSeo } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

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

const tenant = makeTenant();

describe('getPage', () => {
  it('maps the thin page_landing document to module refs', async () => {
    mockRun.mockResolvedValueOnce(makeRawLandingPage());

    const page = await getPage('about', tenant);
    if (!page) throw new Error('expected a landing page');

    expect(page.slug).toBe('about');
    expect(page.modules).toEqual([
      { id: 'content-1', type: 'module_content' },
      { id: 'cta-1', type: 'module_cta' },
    ]);
  });

  it('builds an all-undefined headingBlock when page_landing.headingBlock is unset', async () => {
    mockRun.mockResolvedValueOnce(makeRawLandingPage({ headingBlock: null }));

    const page = await getPage('about', tenant);
    if (!page) throw new Error('expected a landing page');

    expect(page.headingBlock.heading).toBeUndefined();
    expect(page.headingBlock.supportingText).toBeUndefined();
  });

  it('maps an authored page_landing.headingBlock through to the view model', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawLandingPage({
        headingBlock: { heading: 'About Us', supportingText: 'Who we are' },
      }),
    );

    const page = await getPage('about', tenant);
    if (!page) throw new Error('expected a landing page');

    expect(page.headingBlock.heading).toBe('About Us');
    expect(page.headingBlock.supportingText).toBe('Who we are');
  });

  it('leaves hero undefined when page_landing.hero is unset', async () => {
    mockRun.mockResolvedValueOnce(makeRawLandingPage({ hero: null }));

    const page = await getPage('about', tenant);
    if (!page) throw new Error('expected a landing page');

    expect(page.hero).toBeUndefined();
  });

  it('maps a set page_landing.hero to a hero slot', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawLandingPage({ hero: { _id: 'hero-1', _type: 'module_hero' } }),
    );

    const page = await getPage('about', tenant);
    if (!page) throw new Error('expected a landing page');

    expect(page.hero).toEqual({ id: 'hero-1', type: 'module_hero' });
  });

  it('rejects when page_landing.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawLandingPage({
        hero: { _id: 'cta-1', _type: 'module_cta' as never },
      }),
    );

    await expect(getPage('about', tenant)).rejects.toThrow();
  });

  it('lets authored seo override the resolved defaults, with no fallback for an unauthored openGraph', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawLandingPage({
        seo: makeRawSeo({ metaTitle: 'About Us' }),
      }),
    );

    const page = await getPage('about', tenant);
    if (!page) throw new Error('expected a landing page');

    expect(page.seo.title).toBe('About Us');
    expect(page.seo.ogTitle).toBeUndefined();
  });

  it('resolves undefined, rather than rejecting, when no page_landing matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const page = await getPage('missing', tenant);

    expect(page).toBeUndefined();
  });

  it('threads tenant context into the query and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawLandingPage());

    await getPage('about', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:page_landing'] }),
      }),
    );
  });
});
