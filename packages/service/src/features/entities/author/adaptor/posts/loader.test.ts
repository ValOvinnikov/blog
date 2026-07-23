import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawArchivePostCard } from '@blog/service/testing/pages/fixtures';

import { getAuthorPosts } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getAuthorPosts', () => {
  it('maps the raw posts into post cards, preserving query order', async () => {
    mockRun.mockResolvedValueOnce({
      posts: [
        makeRawArchivePostCard({ _id: 'post-1', title: 'Newest' }),
        makeRawArchivePostCard({ _id: 'post-2', title: 'Oldest' }),
      ],
      total: 2,
    });

    const result = await getAuthorPosts('jane-doe', { itemsPerPage: 9 });

    expect(result.posts).toHaveLength(2);
    expect(result.posts.map((post) => post.id)).toEqual(['post-1', 'post-2']);
    expect(result.posts[0]?.title).toBe('Newest');
    expect(result.total).toBe(2);
  });

  it('returns an empty posts array when the author has no posts', async () => {
    mockRun.mockResolvedValueOnce({ posts: [], total: 0 });

    const result = await getAuthorPosts('no-posts-author', {
      itemsPerPage: 9,
    });

    expect(result.posts).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('passes the slug as a query parameter', async () => {
    mockRun.mockResolvedValueOnce({ posts: [], total: 0 });

    await getAuthorPosts('jane-doe', { itemsPerPage: 9 });

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { slug: 'jane-doe' } }),
    );
  });

  it('defaults to page 1 when no page is given', async () => {
    mockRun.mockResolvedValueOnce({
      posts: [makeRawArchivePostCard()],
      total: 20,
    });

    const result = await getAuthorPosts('jane-doe', { itemsPerPage: 9 });

    expect(result.posts).toHaveLength(1);
    expect(result.total).toBe(20);
  });

  it('windows the query using the given page and itemsPerPage', async () => {
    mockRun.mockResolvedValueOnce({
      posts: [
        makeRawArchivePostCard({ _id: 'a' }),
        makeRawArchivePostCard({ _id: 'b' }),
      ],
      total: 20,
    });

    const result = await getAuthorPosts('jane-doe', {
      page: 2,
      itemsPerPage: 5,
    });

    expect(result.posts.map((post) => post.id)).toEqual(['a', 'b']);
    expect(result.total).toBe(20);
  });
});
