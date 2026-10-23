import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_TOPIC_SLUG } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockListModuleRefs } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_PAGE_TOPIC_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TEMPLATE_TOPIC_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';

import { getTopicPaginatedPages } from './loader';
import { topicPaginationParamsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const { EN, NL } = LOCALE_ISO_CODES;
const tenant = mockTenant();

describe(getTopicPaginatedPages, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('returns the paginated pages as queried', async () => {
    const pages = [
      {
        slug: MOCK_TOPIC_SLUG,
        language: EN,
        moduleRefs: mockListModuleRefs(),
        postCount: 20,
      },
    ];
    mockRun.mockResolvedValueOnce(pages);

    const result = await getTopicPaginatedPages(tenant, [EN, NL]);

    expect(result).toEqual(pages);
  });

  it('queries the locales for the tenant and scopes the tags to it', async () => {
    await getTopicPaginatedPages(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(topicPaginationParamsQuery, {
      parameters: { locales: [EN, NL] },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_PAGE_TOPIC_CACHE_TAG,
          MOCK_TEMPLATE_TOPIC_CACHE_TAG,
          MOCK_POSTS_CACHE_TAG,
          MOCK_TOPIC_CACHE_TAG,
        ],
      },
    });
  });
});
