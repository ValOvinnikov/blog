import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawBlogPage } from '@blog/service/testing/pages/fixtures';
import { makeRawOptionalHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getIndexPage } from './loader';

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

describe('getIndexPage', () => {
  it('exposes the headingBlock from the page_blog singleton', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawBlogPage({
          headingBlock: makeRawOptionalHeadingBlock({
            heading: 'Latest posts',
            supportingText: 'Fresh from the team.',
          }),
          seo: {
            metaTitle: 'Latest posts — Blog',
            metaDescription: 'Fresh from the team.',
            openGraph: null,
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.headingBlock).toEqual({
      heading: 'Latest posts',
      supportingText: 'Fresh from the team.',
    });
    expect(result.seo).toEqual({
      title: 'Latest posts — Blog',
      description: 'Fresh from the team.',
      ogTitle: 'Latest posts — Blog',
      ogDescription: 'Fresh from the team.',
      ogImageUrl: expect.stringContaining('sanity.io'),
    });
  });

  it('falls the headingBlock back to an empty object when unset', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawBlogPage({ headingBlock: null }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.headingBlock).toEqual({
      heading: undefined,
      supportingText: undefined,
    });
  });

  it('resolves seo from the authored heading and site settings when the page has no authored seo', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawBlogPage({
          headingBlock: makeRawOptionalHeadingBlock({ heading: 'The Blog' }),
          seo: null,
        }),
      )
      .mockResolvedValueOnce(
        makeRawSiteSettings({ description: 'Notes on building things.' }),
      );

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.seo).toEqual({
      title: 'The Blog',
      description: 'Notes on building things.',
      ogTitle: 'The Blog',
      ogDescription: 'Notes on building things.',
      ogImageUrl: expect.stringContaining('sanity.io'),
    });
  });

  it('falls the seo title back to the brand name when no heading is authored', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawBlogPage({ headingBlock: null, hero: null, seo: null }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.seo.title).toBe('My Blog');
  });

  it('falls the seo title back to the brand name when the authored heading is blank', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawBlogPage({
          headingBlock: makeRawOptionalHeadingBlock({ heading: '   ' }),
          seo: null,
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.seo.title).toBe('My Blog');
    expect(result.headingBlock.heading).toBe('   ');
  });

  it('maps the thin page-builder modules array to module refs', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawBlogPage({
          modules: [{ _id: 'newsletter-1', _type: 'module_newsletter' }],
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.modules).toEqual([
      { id: 'newsletter-1', type: 'module_newsletter' },
    ]);
  });

  it('leaves hero undefined when page_blog.hero is unset', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawBlogPage({ hero: null }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.hero).toBeUndefined();
  });

  it('maps a set page_blog.hero to a hero slot', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawBlogPage({ hero: { _id: 'hero-1', _type: 'module_hero' } }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.hero).toEqual({ id: 'hero-1', type: 'module_hero' });
  });

  it('rejects when page_blog.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawBlogPage({ hero: { _id: 'cta-1', _type: 'module_cta' as never } }),
    );

    await expect(getIndexPage(tenant)).rejects.toThrow();
  });

  it('defaults modules to an empty array when the page has none', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawBlogPage({ modules: null }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.modules).toEqual([]);
  });

  it('resolves undefined, rather than rejecting, when no page_blog document exists', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getIndexPage(tenant);

    expect(result).toBeUndefined();
  });

  it('does not fetch site settings when no page_blog document exists', async () => {
    mockRun.mockResolvedValueOnce(null);

    await getIndexPage(tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context into both queries and scopes their tags to it', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawBlogPage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getIndexPage(tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:page_blog'],
        }),
      }),
    );
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:site-settings'],
        }),
      }),
    );
  });
});
