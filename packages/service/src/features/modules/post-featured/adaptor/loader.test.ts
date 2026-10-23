import { POST_SOURCE, SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockRawPostFeaturedModule } from '@blog/service/testing/modules/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getPostFeatured } from './loader';
import { postFeaturedModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const POST_FEATURED_ID = 'post-featured-1';

const tenant = mockTenant();

describe(getPostFeatured, () => {
  it('maps the pinned posts through', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawPostFeaturedModule({
        postSource: POST_SOURCE.PINNED,
        posts: [
          { post: mockRawPostCard({ _id: 'a' }) },
          { post: mockRawPostCard({ _id: 'b' }) },
        ],
      }),
    );

    const postFeatured = await getPostFeatured(POST_FEATURED_ID, tenant);

    expect(postFeatured.posts.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getPostFeatured(MOCK_MISSING_ID, tenant)).rejects.toThrow();
  });

  it('threads tenant context into the query and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(mockRawPostFeaturedModule());

    await getPostFeatured(POST_FEATURED_ID, tenant);

    expect(mockRun).toHaveBeenCalledWith(postFeaturedModuleQuery, {
      parameters: { id: POST_FEATURED_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          't:tenant-a:modules:postFeatured',
          't:tenant-a:module:post-featured-1',
          MOCK_POSTS_CACHE_TAG,
          MOCK_AUTHOR_CACHE_TAG,
          MOCK_TOPIC_CACHE_TAG,
        ],
      },
    });
  });
});
