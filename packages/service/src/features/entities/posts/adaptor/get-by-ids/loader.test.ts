import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getPostsByIds } from './loader';
import { postsByIdsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6109);

const MOCK_FIRST_POST_ID = faker.string.uuid();
const MOCK_SECOND_POST_ID = faker.string.uuid();
const MOCK_DELETED_POST_ID = faker.string.uuid();
const MOCK_POST_IDS = [MOCK_FIRST_POST_ID, MOCK_SECOND_POST_ID];

const tenant = mockTenant();

describe(getPostsByIds, () => {
  it('resolves an id list to post-card data', async () => {
    mockRun.mockResolvedValue(
      MOCK_POST_IDS.map((_id) => mockRawPostCard({ _id })),
    );

    const result = await getPostsByIds(MOCK_POST_IDS, tenant);

    expect(result.map((post) => post.id)).toEqual(MOCK_POST_IDS);
  });

  it('excludes ids that no longer resolve to a published post', async () => {
    mockRun.mockResolvedValue([mockRawPostCard({ _id: MOCK_FIRST_POST_ID })]);

    const result = await getPostsByIds(
      [MOCK_FIRST_POST_ID, MOCK_DELETED_POST_ID],
      tenant,
    );

    expect(result.map((post) => post.id)).toEqual([MOCK_FIRST_POST_ID]);
  });

  it('returns an empty array without querying when given no ids', async () => {
    const result = await getPostsByIds([], tenant);

    expect(result).toEqual([]);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('queries the ids for the tenant with tenant-scoped cache tags', async () => {
    mockRun.mockResolvedValue([]);

    await getPostsByIds(MOCK_POST_IDS, tenant);

    expect(mockRun).toHaveBeenCalledWith(postsByIdsQuery, {
      parameters: { ids: MOCK_POST_IDS },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_POSTS_CACHE_TAG,
          MOCK_AUTHOR_CACHE_TAG,
          MOCK_TOPIC_CACHE_TAG,
        ],
      },
    });
  });
});
