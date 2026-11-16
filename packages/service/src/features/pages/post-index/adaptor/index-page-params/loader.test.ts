import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import { mockListModuleRefs } from '@shinefold/service/testing/pages/fixtures';
import {
  MOCK_PAGE_POST_INDEX_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TEMPLATE_POST_INDEX_CACHE_TAG,
} from '@shinefold/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@shinefold/service/testing/tenant';

import { getIndexPagePagination } from './loader';
import { indexPageParamsQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(6020);

const MOCK_POST_TOTAL = faker.number.int({ min: 10, max: 99 });
const tenant = mockTenant();

describe(getIndexPagePagination, () => {
  it('returns the queried post count and module refs', async () => {
    const pagination = {
      blogPosts: { total: MOCK_POST_TOTAL },
      moduleRefs: mockListModuleRefs(),
    };
    mockRun.mockResolvedValueOnce(pagination);

    expect(await getIndexPagePagination(tenant)).toEqual(pagination);
  });

  it('queries for the tenant and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce({
      blogPosts: { total: 0 },
      moduleRefs: null,
    });

    await getIndexPagePagination(tenant);

    expect(mockRun).toHaveBeenCalledWith(indexPageParamsQuery, {
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_POSTS_CACHE_TAG,
          MOCK_PAGE_POST_INDEX_CACHE_TAG,
          MOCK_TEMPLATE_POST_INDEX_CACHE_TAG,
        ],
      },
    });
  });
});
