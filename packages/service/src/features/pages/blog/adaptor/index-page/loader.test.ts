import { makeRawPostCard } from '@blog/service/testing/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawBlogPage } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getIndexPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getIndexPage', () => {
  it('returns the page window with page math for a full corpus', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawBlogPage({ itemsPerPage: 9 }))
      .mockResolvedValueOnce({
        posts: [makeRawPostCard({ _id: 'a' }), makeRawPostCard({ _id: 'b' })],
        total: 20,
      });

    const result = await getIndexPage({ page: 2 });

    expect(result.posts.map((p) => p.id)).toEqual(['a', 'b']);
    expect(result.currentPage).toBe(2);
    expect(result.total).toBe(20);
    expect(result.totalPages).toBe(3); // ceil(20 / 9)
  });

  it('takes heading/supportingText/seo from the page_blog singleton and defaults to page 1', async () => {
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
      .mockResolvedValueOnce({
        posts: [makeRawPostCard({ _id: 'a' })],
        total: 1,
      });

    const result = await getIndexPage();

    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.heading).toBe('Latest posts');
    expect(result.supportingText).toBe('Fresh from the team.');
    expect(result.seo).toEqual({
      metaTitle: 'Latest posts — Blog',
      metaDescription: 'Fresh from the team.',
      ogTitle: undefined,
      ogDescription: undefined,
      ogImageUrl: undefined,
    });
  });
});
