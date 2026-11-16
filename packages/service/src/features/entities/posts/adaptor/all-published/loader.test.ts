import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import {
  mockFeedPostViews,
  mockRawFeedPosts,
} from '@shinefold/service/testing/entities/fixtures';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import { MOCK_POSTS_CACHE_TAG } from '@shinefold/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@shinefold/service/testing/tenant';

import { getAllPublishedPosts } from './loader';
import { allPublishedPostsQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

const tenant = mockTenant();

describe(getAllPublishedPosts, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('maps every published post into a feed post', async () => {
    mockRun.mockResolvedValueOnce(mockRawFeedPosts());

    const result = await getAllPublishedPosts(tenant);

    expect(result).toEqual(mockFeedPostViews());
  });

  it('returns an empty array when there are no published posts', async () => {
    const result = await getAllPublishedPosts(tenant);

    expect(result).toEqual([]);
  });

  it('queries unpaginated for the tenant with tenant-scoped tags', async () => {
    await getAllPublishedPosts(tenant);

    expect(mockRun).toHaveBeenCalledWith(allPublishedPostsQuery, {
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_POSTS_CACHE_TAG],
      },
    });
  });
});
