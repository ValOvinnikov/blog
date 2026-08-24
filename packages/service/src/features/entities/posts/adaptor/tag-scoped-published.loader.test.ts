import { makeRawFeedPost } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';

import { getPublishedPostsByTag } from './tag-scoped-published.loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe(getPublishedPostsByTag, () => {
  it('fetches every published post tagged with the given tag id', async () => {
    mockRun.mockResolvedValue([
      makeRawFeedPost({ title: 'First', slug: 'first' }),
      makeRawFeedPost({ title: 'Second', slug: 'second' }),
    ]);

    const result = await getPublishedPostsByTag('tag-1');

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
  });

  it('passes the tag id as a query parameter', async () => {
    mockRun.mockResolvedValue([]);

    await getPublishedPostsByTag('tag-1');

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { tagId: 'tag-1' } }),
    );
  });

  it('tags the ISR call with posts only', async () => {
    mockRun.mockResolvedValue([]);

    await getPublishedPostsByTag('tag-1');

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({ tags: ['posts'] }),
      }),
    );
  });

  it('returns an empty array when no posts are tagged', async () => {
    mockRun.mockResolvedValue([]);

    const result = await getPublishedPostsByTag('tag-1');

    expect(result).toEqual([]);
  });
});
