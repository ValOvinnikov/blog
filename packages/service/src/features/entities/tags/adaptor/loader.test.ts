import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import {
  MOCK_DESIGN_TERM,
  MOCK_ENGINEERING_TERM,
  mockRawTagWithPostCount,
} from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_POSTS_CACHE_TAG,
  MOCK_TAGS_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getTags } from './loader';
import { tagsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6105);

const MOCK_TAG_DESCRIPTION = faker.lorem.sentence();

const tenant = mockTenant();

describe(getTags, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('maps every raw tag into a domain tag with its post count', async () => {
    mockRun.mockResolvedValueOnce([
      mockRawTagWithPostCount(MOCK_DESIGN_TERM),
      mockRawTagWithPostCount(MOCK_ENGINEERING_TERM),
    ]);

    const result = await getTags(tenant);

    expect(result.map((t) => t.id)).toEqual([
      MOCK_DESIGN_TERM._id,
      MOCK_ENGINEERING_TERM._id,
    ]);
    expect(result[0]?.title).toBe(MOCK_DESIGN_TERM.title);
    expect(result[0]?.postCount).toBe(MOCK_DESIGN_TERM.postCount);
    expect(result[1]?.postCount).toBe(MOCK_ENGINEERING_TERM.postCount);
  });

  it('carries a tag description through when authored', async () => {
    mockRun.mockResolvedValueOnce([
      mockRawTagWithPostCount({ description: MOCK_TAG_DESCRIPTION }),
    ]);

    const result = await getTags(tenant);

    expect(result[0]?.description).toBe(MOCK_TAG_DESCRIPTION);
  });

  it('normalises a missing description to undefined', async () => {
    mockRun.mockResolvedValueOnce([
      mockRawTagWithPostCount({ description: null }),
    ]);

    const result = await getTags(tenant);

    expect(result[0]?.description).toBeUndefined();
  });

  it('returns an empty list when there are no tags', async () => {
    const result = await getTags(tenant);

    expect(result).toEqual([]);
  });

  it('queries for the tenant with tenant-scoped cache tags', async () => {
    await getTags(tenant);

    expect(mockRun).toHaveBeenCalledWith(tagsQuery, {
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_TAGS_CACHE_TAG, MOCK_POSTS_CACHE_TAG],
      },
    });
  });
});
