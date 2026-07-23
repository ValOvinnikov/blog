import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  makeRawArchivePostCard,
  makeRawBlogPage,
} from '@blog/service/testing/pages/fixtures';

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
  it('returns the page window with page math for a full corpus', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawBlogPage({ itemsPerPage: 9 }))
      .mockResolvedValueOnce(makeRawSiteSettings())
      .mockResolvedValueOnce({
        posts: [
          makeRawArchivePostCard({ _id: 'a' }),
          makeRawArchivePostCard({ _id: 'b' }),
        ],
        total: 20,
      });

    const result = await getIndexPage({ page: 2 });

    expect(result.posts.map((p) => p.id)).toEqual(['a', 'b']);
    expect(result.currentPage).toBe(2);
    expect(result.totalPages).toBe(3); // ceil(20 / 9)
  });

  it('takes heading/supportingText from the page_blog singleton and defaults to page 1', async () => {
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
      .mockResolvedValueOnce(makeRawSiteSettings())
      .mockResolvedValueOnce({
        posts: [makeRawArchivePostCard({ _id: 'a' })],
        total: 1,
      });

    const result = await getIndexPage();

    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(1);
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
      )
      .mockResolvedValueOnce({
        posts: [],
        total: 0,
      });

    const result = await getIndexPage();

    expect(result.seo).toEqual({
      title: 'The Blog',
      description: 'Notes on building things.',
      ogTitle: 'The Blog',
      ogDescription: 'Notes on building things.',
      ogImageUrl: expect.stringContaining('sanity.io'),
    });
  });
});
