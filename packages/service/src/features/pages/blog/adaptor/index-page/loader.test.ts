import { makeRawPostCard } from '@blog/service/testing/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawBlogIndexSettings } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getIndexPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getIndexPage', () => {
  it('returns the page window with page math for a full corpus', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawBlogIndexSettings({ itemsPerPage: 9 }))
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

  it('takes heading/supportingText/seo from settings and defaults to page 1', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawBlogIndexSettings({
          heading: 'Latest posts',
          supportingText: 'Fresh from the team.',
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
  });

  it('falls back to "Blog" heading and POSTS_PER_PAGE when page_blog is unauthored', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ posts: [], total: 0 });

    const result = await getIndexPage({ page: 1 });

    expect(result.heading).toBe('Blog');
    expect(result.supportingText).toBeUndefined();
    expect(result.posts).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1); // Math.max(1, ceil(0/9))
  });
});
