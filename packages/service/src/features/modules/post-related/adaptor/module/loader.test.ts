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
import { MOCK_TENANT } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getPostRelatedModuleDocument } from './loader';
import { postRelatedModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(21);

const MOCK_LIMIT = faker.number.int({ min: 1, max: 12 });

describe(getPostRelatedModuleDocument, () => {
  it('resolves the module document fields, including its limit', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawPostRelatedModule({ limit: MOCK_LIMIT }),
    );

    const module = await getPostRelatedModuleDocument(
      MOCK_POST_RELATED_MODULE_ID,
      MOCK_TENANT,
    );

    expect(module.limit).toBe(MOCK_LIMIT);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getPostRelatedModuleDocument(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
  });

  it('queries the module by id for the tenant with its cache tags', async () => {
    mockRun.mockResolvedValueOnce(mockRawPostRelatedModule());

    await getPostRelatedModuleDocument(
      MOCK_POST_RELATED_MODULE_ID,
      MOCK_TENANT,
    );

    expect(mockRun).toHaveBeenCalledWith(postRelatedModuleQuery, {
      parameters: { id: MOCK_POST_RELATED_MODULE_ID },
      tenant: MOCK_TENANT,
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
