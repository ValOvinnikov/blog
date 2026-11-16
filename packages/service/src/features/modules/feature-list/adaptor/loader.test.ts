import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import {
  MOCK_FEATURE_LIST_MODULE_ID,
  mockRawFeatureListModule,
} from '@shinefold/service/testing/modules/feature-list/fixtures';
import {
  MOCK_LINK_TARGET_CACHE_TAGS,
  mockCacheTag,
} from '@shinefold/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@shinefold/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { getFeatureList } from './loader';
import { featureListModuleQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(1);

const MOCK_FEATURE_LIST_HEADING = faker.lorem.words(3);

describe(getFeatureList, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawFeatureListModule({
        headingBlock: mockRawHeadingBlock(MOCK_FEATURE_LIST_HEADING),
      }),
    );
  });

  it('resolves the module with a single query', async () => {
    const featureList = await getFeatureList(
      MOCK_FEATURE_LIST_MODULE_ID,
      MOCK_TENANT,
    );

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(featureList.headingBlock.heading).toBe(MOCK_FEATURE_LIST_HEADING);
  });

  it('propagates when the module document is missing', async () => {
    const error = mockValidationError();
    mockRun.mockRejectedValueOnce(error);

    await expect(getFeatureList(MOCK_MISSING_ID, MOCK_TENANT)).rejects.toBe(
      error,
    );
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    await getFeatureList(MOCK_FEATURE_LIST_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(featureListModuleQuery, {
      parameters: { id: MOCK_FEATURE_LIST_MODULE_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:featureList'),
          mockCacheTag(`module:${MOCK_FEATURE_LIST_MODULE_ID}`),
          mockCacheTag('block_feature'),
          ...MOCK_LINK_TARGET_CACHE_TAGS,
        ],
      },
    });
  });
});
