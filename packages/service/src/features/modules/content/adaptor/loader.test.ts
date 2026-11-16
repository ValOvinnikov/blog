import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import {
  MOCK_CONTENT_MODULE_ID,
  mockRawContentModule,
} from '@shinefold/service/testing/modules/fixtures';
import {
  MOCK_LINK_TARGET_CACHE_TAGS,
  mockCacheTag,
} from '@shinefold/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@shinefold/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { getContent } from './loader';
import { contentModuleQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

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
          ...MOCK_LINK_TARGET_CACHE_TAGS,
        ],
      },
    });
  });
});
