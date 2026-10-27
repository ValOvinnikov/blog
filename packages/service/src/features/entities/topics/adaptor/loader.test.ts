import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import {
  MOCK_DESIGN_TERM,
  MOCK_ENGINEERING_TERM,
  mockRawTopicWithPostCount,
} from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_POSTS_CACHE_TAG,
  MOCK_TOPICS_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';

import { getTopics } from './loader';
import { topicsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();

describe(getTopics, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('maps every raw topic into a domain topic with its post count', async () => {
    mockRun.mockResolvedValueOnce([
      mockRawTopicWithPostCount(MOCK_DESIGN_TERM),
      mockRawTopicWithPostCount(MOCK_ENGINEERING_TERM),
    ]);

    const result = await getTopics(tenant);

    expect(result.map((t) => t.id)).toEqual([
      MOCK_DESIGN_TERM._id,
      MOCK_ENGINEERING_TERM._id,
    ]);
    expect(result[0]?.title).toBe(MOCK_DESIGN_TERM.title);
    expect(result[0]?.postCount).toBe(MOCK_DESIGN_TERM.postCount);
    expect(result[1]?.postCount).toBe(MOCK_ENGINEERING_TERM.postCount);
  });

  it('returns an empty list when there are no topics', async () => {
    const result = await getTopics(tenant);

    expect(result).toEqual([]);
  });

  it('queries for the tenant with tenant-scoped cache tags', async () => {
    await getTopics(tenant);

    expect(mockRun).toHaveBeenCalledWith(topicsQuery, {
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_TOPICS_CACHE_TAG, MOCK_POSTS_CACHE_TAG],
      },
    });
  });
});
