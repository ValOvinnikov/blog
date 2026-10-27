import { POST_SOURCE, SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockRawPostFeaturedModule } from '@blog/service/testing/modules/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
  mockCacheTag,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getPostFeatured } from './loader';
import { postFeaturedModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6014);

const MOCK_POST_FEATURED_ID = faker.string.uuid();
const MOCK_FIRST_POST_ID = faker.string.uuid();
const MOCK_SECOND_POST_ID = faker.string.uuid();

describe(getPostFeatured, () => {
  it('maps the pinned posts through', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawPostFeaturedModule({
        postSource: POST_SOURCE.PINNED,
        posts: [
          { post: mockRawPostCard({ _id: MOCK_FIRST_POST_ID }) },
          { post: mockRawPostCard({ _id: MOCK_SECOND_POST_ID }) },
        ],
      }),
    );

    const postFeatured = await getPostFeatured(
      MOCK_POST_FEATURED_ID,
      MOCK_TENANT,
    );

    expect(postFeatured.posts.map((post) => post.id)).toEqual([
      MOCK_FIRST_POST_ID,
      MOCK_SECOND_POST_ID,
    ]);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getPostFeatured(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
  });

  it('fetches for the tenant with tags scoped to the module', async () => {
    mockRun.mockResolvedValueOnce(mockRawPostFeaturedModule());

    await getPostFeatured(MOCK_POST_FEATURED_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(postFeaturedModuleQuery, {
      parameters: { id: MOCK_POST_FEATURED_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:postFeatured'),
          mockCacheTag(`module:${MOCK_POST_FEATURED_ID}`),
          MOCK_POSTS_CACHE_TAG,
          MOCK_AUTHOR_CACHE_TAG,
          MOCK_TOPIC_CACHE_TAG,
        ],
      },
    });
  });
});
