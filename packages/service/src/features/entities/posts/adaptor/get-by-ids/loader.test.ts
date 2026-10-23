import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';

import { getPostsByIds } from './loader';
import { postsByIdsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const FIRST_POST_ID = 'first-post';
const SECOND_POST_ID = 'second-post';
const POST_IDS = [FIRST_POST_ID, SECOND_POST_ID];

const tenant = mockTenant();

describe(getPostsByIds, () => {
  it('resolves an id list to post-card data', async () => {
    mockRun.mockResolvedValue(POST_IDS.map((_id) => mockRawPostCard({ _id })));

    const result = await getPostsByIds(POST_IDS, tenant);

    expect(result.map((post) => post.id)).toEqual(POST_IDS);
  });

  it('excludes ids that no longer resolve to a published post', async () => {
    mockRun.mockResolvedValue([mockRawPostCard({ _id: FIRST_POST_ID })]);

    const result = await getPostsByIds([FIRST_POST_ID, 'deleted-id'], tenant);

    expect(result.map((post) => post.id)).toEqual([FIRST_POST_ID]);
  });

  it('returns an empty array without querying when given no ids', async () => {
    const result = await getPostsByIds([], tenant);

    expect(result).toEqual([]);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('queries the ids for the tenant with tenant-scoped tags', async () => {
    mockRun.mockResolvedValue([]);

    await getPostsByIds(POST_IDS, tenant);

    expect(mockRun).toHaveBeenCalledWith(postsByIdsQuery, {
      parameters: { ids: POST_IDS },
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
