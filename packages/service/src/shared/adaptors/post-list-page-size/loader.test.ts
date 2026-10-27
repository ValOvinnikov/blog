import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { MOCK_LIST_MODULE_ID } from '@blog/service/testing/pages/fixtures';
import { MOCK_MODULES_POST_LIST_CACHE_TAG } from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getPostListPageSizes } from './loader';
import { postListPageSizeQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

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
