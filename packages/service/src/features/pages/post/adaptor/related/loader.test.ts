import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { getRelatedPosts } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe(getRelatedPosts, () => {
  it('queries by shared tags and the primary topic, then ranks the results', async () => {
    mockRun
      .mockResolvedValueOnce([
        {
          ...makeRawPostCard({ _id: 'tag-match' }),
          tagIds: [{ _id: 'tag-a' }],
        },
      ])
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'topic-match' })]);

    const result = await getRelatedPosts('current-id', ['tag-a'], 'topic-1');

    expect(result.map((post) => post.id)).toEqual(['tag-match', 'topic-match']);
    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        parameters: { currentId: 'current-id', tagIds: ['tag-a'] },
      }),
    );
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        parameters: { currentId: 'current-id', topicId: 'topic-1' },
      }),
    );
  });

  it('skips the shared-tags query entirely when the post has no tags', async () => {
    mockRun.mockResolvedValueOnce([makeRawPostCard({ _id: 'topic-match' })]);

    const result = await getRelatedPosts('current-id', [], 'topic-1');

    expect(result.map((post) => post.id)).toEqual(['topic-match']);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('skips the topic-backfill query entirely when the post has no primary topic', async () => {
    mockRun.mockResolvedValueOnce([
      { ...makeRawPostCard({ _id: 'tag-match' }), tagIds: [{ _id: 'tag-a' }] },
    ]);

    const result = await getRelatedPosts('current-id', ['tag-a'], undefined);

    expect(result.map((post) => post.id)).toEqual(['tag-match']);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when nothing qualifies', async () => {
    mockRun.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await getRelatedPosts('current-id', ['tag-a'], 'topic-1');

    expect(result).toEqual([]);
  });

  it('tags both queries with author/topic alongside posts, plus tag on the byTags query only', async () => {
    mockRun.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await getRelatedPosts('current-id', ['tag-a'], 'topic-1');

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: ['posts', 'author', 'topic', 'tag'],
        }),
      }),
    );
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: ['posts', 'author', 'topic'],
        }),
      }),
    );
  });
});
