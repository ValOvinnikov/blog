import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getRelatedPosts } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getRelatedPosts, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(null);
  });

  it('ranks tag matches ahead of the topic backfill', async () => {
    mockRun
      .mockResolvedValueOnce({
        tagIds: [{ _id: 'tag-a' }],
        topicId: { _id: 'topic-1' },
      })
      .mockResolvedValueOnce([
        {
          ...makeRawPostCard({ _id: 'tag-match' }),
          tagIds: [{ _id: 'tag-a' }],
        },
      ])
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'topic-match' })]);

    const posts = await getRelatedPosts('post-1', 3, tenant);

    expect(posts.map((post) => post.id)).toEqual(['tag-match', 'topic-match']);
  });

  it('skips the shared-tags query entirely when the anchor post has no tags', async () => {
    mockRun
      .mockResolvedValueOnce({ tagIds: [], topicId: { _id: 'topic-1' } })
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'topic-match' })]);

    const posts = await getRelatedPosts('post-1', 3, tenant);

    expect(posts.map((post) => post.id)).toEqual(['topic-match']);
    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('skips the topic-backfill query entirely when the anchor post has no primary topic', async () => {
    mockRun
      .mockResolvedValueOnce({ tagIds: [{ _id: 'tag-a' }], topicId: null })
      .mockResolvedValueOnce([
        {
          ...makeRawPostCard({ _id: 'tag-match' }),
          tagIds: [{ _id: 'tag-a' }],
        },
      ]);

    const posts = await getRelatedPosts('post-1', 3, tenant);

    expect(posts.map((post) => post.id)).toEqual(['tag-match']);
    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('returns an empty list when the anchor post resolves to no candidates', async () => {
    const posts = await getRelatedPosts('post-1', 3, tenant);

    expect(posts).toEqual([]);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context into the anchor-post lookup, scoped by the given post id', async () => {
    await getRelatedPosts('post-1', 3, tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        parameters: { postId: 'post-1' },
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:posts', 't:tenant-a:topic', 't:tenant-a:tag'],
        }),
      }),
    );
  });
});
