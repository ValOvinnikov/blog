import { MissingPostListError } from '@blog/service/features/pages/blog/adaptor/missing-post-list-error';
import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawBlogPage } from '@blog/service/testing/pages/fixtures';

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

describe('getIndexPage', () => {
  it('exposes the postList module id from page_blog.postList', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawBlogPage({ postList: { _id: 'post-list-1' } }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage();

    expect(result.postListId).toBe('post-list-1');
  });

  it('takes heading/supportingText from the page_blog singleton', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawBlogPage({
          heading: 'Latest posts',
          supportingText: 'Fresh from the team.',
          seo: {
            metaTitle: 'Latest posts — Blog',
            metaDescription: 'Fresh from the team.',
            openGraph: null,
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage();

    expect(result.heading).toBe('Latest posts');
    expect(result.supportingText).toBe('Fresh from the team.');
    expect(result.seo).toEqual({
      title: 'Latest posts — Blog',
      description: 'Fresh from the team.',
      ogTitle: 'Latest posts — Blog',
      ogDescription: 'Fresh from the team.',
      ogImageUrl: expect.stringContaining('sanity.io'),
    });
  });

  it('resolves seo from the heading and site settings when the page has no authored seo', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawBlogPage({ heading: 'The Blog', seo: null }),
      )
      .mockResolvedValueOnce(
        makeRawSiteSettings({ description: 'Notes on building things.' }),
      );

    const result = await getIndexPage();

    expect(result.seo).toEqual({
      title: 'The Blog',
      description: 'Notes on building things.',
      ogTitle: 'The Blog',
      ogDescription: 'Notes on building things.',
      ogImageUrl: expect.stringContaining('sanity.io'),
    });
  });

  it('maps the thin page-builder modules array to module refs', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawBlogPage({
          modules: [{ _id: 'newsletter-1', _type: 'module_newsletter' }],
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage();

    expect(result.modules).toEqual([
      { id: 'newsletter-1', type: 'module_newsletter' },
    ]);
  });

  it('defaults modules to an empty array when the page has none', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawBlogPage({ modules: null }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage();

    expect(result.modules).toEqual([]);
  });

  it('tags the page_blog query with modules:postList alongside page_blog', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawBlogPage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getIndexPage();

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: ['page_blog', 'modules:postList'],
        }),
      }),
    );
  });

  // Regression guard for the decision that a missing slot is a loud failure,
  // never a substituted default: this must reject rather than resolve with
  // an invented module id.
  it('rejects with MissingPostListError when page_blog.postList is unset', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawBlogPage({ postList: null }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    await expect(getIndexPage()).rejects.toThrow(MissingPostListError);
    expect(mockRun).toHaveBeenCalledTimes(2);
  });
});
