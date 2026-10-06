import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostRelatedModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPostRelated } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getPostRelated, () => {
  it('resolves the module fields, ranked related posts capped at the module limit', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostRelatedModule({ limit: 3 }))
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

    const result = await getPostRelated('post-related-1', 'post-1', tenant);

    expect(result.posts.map((post) => post.id)).toEqual([
      'tag-match',
      'topic-match',
    ]);
  });

  it('caps the result at a module-authored limit larger than 3', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostRelatedModule({ limit: 6 }))
      .mockResolvedValueOnce({
        tagIds: [{ _id: 'tag-a' }],
        topicId: null,
      })
      .mockResolvedValueOnce(
        Array.from({ length: 8 }, (_, i) => ({
          ...makeRawPostCard({ _id: `post-${i}` }),
          tagIds: [{ _id: 'tag-a' }],
        })),
      )
      .mockResolvedValueOnce([]);

    const result = await getPostRelated('post-related-1', 'post-1', tenant);

    expect(result.posts).toHaveLength(6);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPostRelated('missing', 'post-1', tenant)).rejects.toThrow();
  });

  it('threads tenant context into the module query and scopes its tags to it', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostRelatedModule({ limit: 3 }))
      .mockResolvedValueOnce(null);

    await getPostRelated('post-related-1', 'post-1', tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        parameters: { id: 'post-related-1' },
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:postRelated',
            't:tenant-a:module:post-related-1',
          ],
        }),
      }),
    );
  });
});
