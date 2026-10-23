import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import {
  mockFeedPostViews,
  mockRawFeedPosts,
} from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { MOCK_POSTS_CACHE_TAG } from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';

import { getAllPublishedPosts } from './loader';
import { allPublishedPostsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

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
