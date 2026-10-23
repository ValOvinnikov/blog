import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockListModuleRefs } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_PAGE_POST_INDEX_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TEMPLATE_POST_INDEX_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';

import { getIndexPagePagination } from './loader';
import { indexPageParamsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();

describe(getIndexPagePagination, () => {
  it('returns the post count and module refs as queried', async () => {
    const pagination = {
      blogPosts: { total: 20 },
      moduleRefs: mockListModuleRefs(),
    };
    mockRun.mockResolvedValueOnce(pagination);

    expect(await getIndexPagePagination(tenant)).toEqual(pagination);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
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
