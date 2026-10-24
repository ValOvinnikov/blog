import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import {
  MOCK_TAG_ID,
  mockFeedPostViews,
  mockRawFeedPosts,
} from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { MOCK_POSTS_CACHE_TAG } from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';

import { getPublishedPostsByTag } from './loader';
import { tagScopedPublishedPostsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();

describe(getPublishedPostsByTag, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('maps every published post tagged with the tag into a feed post', async () => {
    mockRun.mockResolvedValueOnce(mockRawFeedPosts());

    const result = await getPublishedPostsByTag(MOCK_TAG_ID, tenant);

    expect(result).toEqual(mockFeedPostViews());
  });

  it('returns an empty array when no posts are tagged', async () => {
    const result = await getPublishedPostsByTag(MOCK_TAG_ID, tenant);

    expect(result).toEqual([]);
  });

  it('queries the tag id for the tenant with tenant-scoped tags', async () => {
    await getPublishedPostsByTag(MOCK_TAG_ID, tenant);

    expect(mockRun).toHaveBeenCalledWith(tagScopedPublishedPostsQuery, {
      parameters: { tagId: MOCK_TAG_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_POSTS_CACHE_TAG],
      },
    });
  });
});
