import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { getAuthorPosts } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getAuthorPosts', () => {
  it('maps the raw posts into post cards, preserving query order', async () => {
    mockRun.mockResolvedValueOnce([
      makeRawPostCard({ _id: 'post-1', title: 'Newest' }),
      makeRawPostCard({ _id: 'post-2', title: 'Oldest' }),
    ]);

    const result = await getAuthorPosts('jane-doe');

    expect(result).toHaveLength(2);
    expect(result.map((post) => post.id)).toEqual(['post-1', 'post-2']);
    expect(result[0]?.title).toBe('Newest');
  });

  it('returns an empty array when the author has no posts', async () => {
    mockRun.mockResolvedValueOnce([]);

    const result = await getAuthorPosts('no-posts-author');

    expect(result).toEqual([]);
  });

  it('passes the slug as a query parameter', async () => {
    mockRun.mockResolvedValueOnce([]);

    await getAuthorPosts('jane-doe');

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { slug: 'jane-doe' } }),
    );
  });
});
