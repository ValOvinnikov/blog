import { makeRawFeedPost } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';

import { getAllPublishedPosts } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe(getAllPublishedPosts, () => {
  it('fetches every published post with no pagination parameters', async () => {
    mockRun.mockResolvedValue([
      makeRawFeedPost({ title: 'First', slug: 'first' }),
      makeRawFeedPost({ title: 'Second', slug: 'second' }),
    ]);

    const result = await getAllPublishedPosts();

    expect(result).toEqual([
      {
        title: 'First',
        slug: 'first',
        excerpt: 'A sufficiently long excerpt for the card.',
        publishedAt: '2026-01-15T00:00:00Z',
      },
      {
        title: 'Second',
        slug: 'second',
        excerpt: 'A sufficiently long excerpt for the card.',
        publishedAt: '2026-01-15T00:00:00Z',
      },
    ]);
    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.not.objectContaining({ parameters: expect.anything() }),
    );
  });

  it('tags the ISR call with posts only', async () => {
    mockRun.mockResolvedValue([]);

    await getAllPublishedPosts();

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({ tags: ['posts'] }),
      }),
    );
  });

  it('returns an empty array when there are no published posts', async () => {
    mockRun.mockResolvedValue([]);

    const result = await getAllPublishedPosts();

    expect(result).toEqual([]);
  });
});
