import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { getRelatedPosts } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe(getRelatedPosts, () => {
  it('queries by shared tags and the primary category, then ranks the results', async () => {
    mockRun
      .mockResolvedValueOnce([
        {
          ...makeRawPostCard({ _id: 'tag-match' }),
          tagIds: [{ _id: 'tag-a' }],
        },
      ])
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'category-match' })]);

    const result = await getRelatedPosts('current-id', ['tag-a'], 'cat-1');

    expect(result.map((post) => post.id)).toEqual([
      'tag-match',
      'category-match',
    ]);
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
        parameters: { currentId: 'current-id', categoryId: 'cat-1' },
      }),
    );
  });

  it('skips the shared-tags query entirely when the post has no tags', async () => {
    mockRun.mockResolvedValueOnce([makeRawPostCard({ _id: 'category-match' })]);

    const result = await getRelatedPosts('current-id', [], 'cat-1');

    expect(result.map((post) => post.id)).toEqual(['category-match']);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('skips the category-backfill query entirely when the post has no primary category', async () => {
    mockRun.mockResolvedValueOnce([
      { ...makeRawPostCard({ _id: 'tag-match' }), tagIds: [{ _id: 'tag-a' }] },
    ]);

    const result = await getRelatedPosts('current-id', ['tag-a'], undefined);

    expect(result.map((post) => post.id)).toEqual(['tag-match']);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when nothing qualifies', async () => {
    mockRun.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await getRelatedPosts('current-id', ['tag-a'], 'cat-1');

    expect(result).toEqual([]);
  });
});
