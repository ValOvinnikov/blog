import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_TAG_SLUG } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockListModuleRefs } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_PAGE_TAG_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TAG_CACHE_TAG,
  MOCK_TEMPLATE_TAG_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';

import { getTagPaginatedPages } from './loader';
import { tagPaginationParamsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const { EN, NL } = LOCALE_ISO_CODES;
const tenant = mockTenant();

describe(getTagPaginatedPages, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('returns the paginated pages as queried', async () => {
    const pages = [
      {
        slug: MOCK_TAG_SLUG,
        language: EN,
        moduleRefs: mockListModuleRefs(),
        postCount: 20,
      },
    ];
    mockRun.mockResolvedValueOnce(pages);

    const result = await getTagPaginatedPages(tenant, [EN, NL]);

    expect(result).toEqual(pages);
  });

  it('queries the locales for the tenant and scopes the tags to it', async () => {
    await getTagPaginatedPages(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(tagPaginationParamsQuery, {
      parameters: { locales: [EN, NL] },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_PAGE_TAG_CACHE_TAG,
          MOCK_TEMPLATE_TAG_CACHE_TAG,
          MOCK_POSTS_CACHE_TAG,
          MOCK_TAG_CACHE_TAG,
        ],
      },
    });
  });
});
