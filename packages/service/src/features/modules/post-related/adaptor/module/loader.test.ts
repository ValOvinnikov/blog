import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_POST_RELATED_MODULE_ID,
  mockRawPostRelatedModule,
} from '@blog/service/testing/modules/fixtures';
import { mockCacheTag } from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getPostRelatedModuleDocument } from './loader';
import { postRelatedModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();

describe(getPostRelatedModuleDocument, () => {
  it('resolves the module document fields, including its limit', async () => {
    mockRun.mockResolvedValueOnce(mockRawPostRelatedModule({ limit: 6 }));

    const module = await getPostRelatedModuleDocument(
      MOCK_POST_RELATED_MODULE_ID,
      tenant,
    );

    expect(module.limit).toBe(6);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getPostRelatedModuleDocument(MOCK_MISSING_ID, tenant),
    ).rejects.toThrow();
  });

  it('threads tenant context into the module query and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(mockRawPostRelatedModule());

    await getPostRelatedModuleDocument(MOCK_POST_RELATED_MODULE_ID, tenant);

    expect(mockRun).toHaveBeenCalledWith(postRelatedModuleQuery, {
      parameters: { id: MOCK_POST_RELATED_MODULE_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:postRelated'),
          mockCacheTag(`module:${MOCK_POST_RELATED_MODULE_ID}`),
        ],
      },
    });
  });
});
