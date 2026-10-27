import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_CONTENT_MODULE_ID,
  mockRawContentModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_HOME_PAGE_CACHE_TAG,
  MOCK_LINK_CACHE_TAG,
  MOCK_PAGE_LANDING_CACHE_TAG,
  MOCK_PAGE_POST_CACHE_TAG,
  MOCK_PAGE_POST_INDEX_CACHE_TAG,
  MOCK_PAGE_TAG_CACHE_TAG,
  MOCK_PAGE_TAG_INDEX_CACHE_TAG,
  MOCK_PAGE_TOPIC_CACHE_TAG,
  MOCK_PAGE_TOPIC_INDEX_CACHE_TAG,
  mockCacheTag,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@blog/service/testing/tenant';

import { getContent } from './loader';
import { contentModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

describe(getContent, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawContentModule());
  });

  it('maps the content module document', async () => {
    const content = await getContent(MOCK_CONTENT_MODULE_ID, MOCK_TENANT);

    expect(content.body).toHaveLength(1);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getContent(MOCK_MISSING_ID, MOCK_TENANT)).rejects.toThrow();
  });

  it('queries with the tenant and the cache tags scoped to it', async () => {
    await getContent(MOCK_CONTENT_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(contentModuleQuery, {
      parameters: { id: MOCK_CONTENT_MODULE_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:content'),
          mockCacheTag(`module:${MOCK_CONTENT_MODULE_ID}`),
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
          MOCK_PAGE_POST_CACHE_TAG,
          MOCK_PAGE_POST_INDEX_CACHE_TAG,
          MOCK_PAGE_TOPIC_CACHE_TAG,
          MOCK_PAGE_TOPIC_INDEX_CACHE_TAG,
          MOCK_PAGE_TAG_CACHE_TAG,
          MOCK_PAGE_TAG_INDEX_CACHE_TAG,
        ],
      },
    });
  });
});
