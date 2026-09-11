import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawBlogPage } from '@blog/service/testing/pages/fixtures';
import {
  makeRawOptionalHeadingBlock,
  makeRawSeo,
} from '@blog/service/testing/shared/fixtures';
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
    mockRun.mockResolvedValueOnce(
      makeRawBlogPage({
        headingBlock: makeRawOptionalHeadingBlock({
          heading: 'Latest posts',
          supportingText: 'Fresh from the team.',
        }),
        seo: makeRawSeo({
          metaTitle: 'Latest posts — Blog',
          metaDescription: 'Fresh from the team.',
        }),
      }),
    );

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.headingBlock).toEqual({
      heading: 'Latest posts',
      supportingText: 'Fresh from the team.',
    });
    expect(result.seo.title).toBe('Latest posts — Blog');
    expect(result.seo.description).toBe('Fresh from the team.');
  });

  it('falls the headingBlock back to an empty object when unset', async () => {
    mockRun.mockResolvedValueOnce(makeRawBlogPage({ headingBlock: null }));

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.headingBlock).toEqual({
      heading: undefined,
      supportingText: undefined,
    });
  });

  it('maps the thin page-builder modules array to module refs', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawBlogPage({
        modules: [{ _id: 'newsletter-1', _type: 'module_newsletter' }],
      }),
    );

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.modules).toEqual([
      { id: 'newsletter-1', type: 'module_newsletter' },
    ]);
  });

  it('leaves hero undefined when page_blog.hero is unset', async () => {
    mockRun.mockResolvedValueOnce(makeRawBlogPage({ hero: null }));

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.hero).toBeUndefined();
  });

  it('maps a set page_blog.hero to a hero slot', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawBlogPage({ hero: { _id: 'hero-1', _type: 'module_hero' } }),
    );

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
    mockRun.mockResolvedValueOnce(makeRawBlogPage({ modules: null }));

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a blog index page');

    expect(result.modules).toEqual([]);
  });

  it('resolves undefined, rather than rejecting, when no page_blog document exists', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getIndexPage(tenant);

    expect(result).toBeUndefined();
  });

  it('threads tenant context into the query and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawBlogPage());

    await getIndexPage(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:page_blog'],
        }),
      }),
    );
  });
});
