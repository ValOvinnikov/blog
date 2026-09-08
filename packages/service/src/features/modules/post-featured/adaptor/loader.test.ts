import { POST_SOURCE } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostFeaturedModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPostFeatured } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getPostFeatured, () => {
  it('maps the pinned posts through', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostFeaturedModule({
        postSource: POST_SOURCE.PINNED,
        posts: [makeRawPostCard({ _id: 'a' }), makeRawPostCard({ _id: 'b' })],
      }),
    );

    const postFeatured = await getPostFeatured('post-featured-1', tenant);

    expect(postFeatured.posts.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('returns an empty list when nothing resolves', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostFeaturedModule({
        postSource: POST_SOURCE.NEWEST_FEATURED,
        limit: 3,
        posts: [],
      }),
    );

    const postFeatured = await getPostFeatured('post-featured-1', tenant);

    expect(postFeatured.posts).toEqual([]);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPostFeatured('missing', tenant)).rejects.toThrow();
  });

  it('threads tenant context into the query and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawPostFeaturedModule());

    await getPostFeatured('post-featured-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        parameters: { id: 'post-featured-1' },
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:postFeatured',
            't:tenant-a:module:post-featured-1',
            't:tenant-a:posts',
            't:tenant-a:author',
            't:tenant-a:topic',
          ],
        }),
      }),
    );
  });
});
