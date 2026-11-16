import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { MOCK_TAG_SLUG } from '@shinefold/service/testing/entities/fixtures';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import { mockListModuleRefs } from '@shinefold/service/testing/pages/fixtures';
import {
  MOCK_PAGE_TAG_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TAG_CACHE_TAG,
  MOCK_TEMPLATE_TAG_CACHE_TAG,
} from '@shinefold/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@shinefold/service/testing/tenant';

import { getTagPaginatedPages } from './loader';
import { tagPaginationParamsQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_POST_COUNT = 20;
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
        postCount: MOCK_POST_COUNT,
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
