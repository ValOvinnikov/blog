import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import { MOCK_LIST_MODULE_ID } from '@shinefold/service/testing/pages/fixtures';
import { MOCK_MODULES_POST_LIST_CACHE_TAG } from '@shinefold/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@shinefold/service/testing/tenant';

import { getPostListPageSizes } from './loader';
import { postListPageSizeQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(6016);

const MOCK_SECOND_LIST_MODULE_ID = faker.string.uuid();
const MOCK_TENANT = mockTenant();

describe(getPostListPageSizes, () => {
  it('queries the ids with cache tags scoped to the tenant', async () => {
    mockRun.mockResolvedValueOnce([]);

    await getPostListPageSizes(
      [MOCK_LIST_MODULE_ID, MOCK_SECOND_LIST_MODULE_ID],
      MOCK_TENANT,
    );

    expect(mockRun).toHaveBeenCalledExactlyOnceWith(postListPageSizeQuery, {
      parameters: { ids: [MOCK_LIST_MODULE_ID, MOCK_SECOND_LIST_MODULE_ID] },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_MODULES_POST_LIST_CACHE_TAG],
      },
    });
  });

  it('makes no request when given no ids', async () => {
    const result = await getPostListPageSizes([], MOCK_TENANT);

    expect(result).toEqual([]);
    expect(mockRun).not.toHaveBeenCalled();
  });
});
