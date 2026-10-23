import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_FEATURE_LIST_MODULE_ID,
  mockRawFeatureListModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_HOME_PAGE_CACHE_TAG,
  MOCK_LINK_CACHE_TAG,
  MOCK_PAGE_LANDING_CACHE_TAG,
  mockCacheTag,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getFeatureList } from './loader';
import { featureListModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const FEATURE_LIST_HEADING = 'What we ship';

const tenant = mockTenant();

describe(getFeatureList, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawFeatureListModule());
  });

  it('resolves the module in a single round trip — exactly one runQuery call', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawFeatureListModule({
        headingBlock: mockRawHeadingBlock(FEATURE_LIST_HEADING),
      }),
    );

    const featureList = await getFeatureList(
      MOCK_FEATURE_LIST_MODULE_ID,
      tenant,
    );

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(featureList.headingBlock.heading).toBe(FEATURE_LIST_HEADING);
  });

  it('returns the referenced cards in authored order', async () => {
    const featureList = await getFeatureList(
      MOCK_FEATURE_LIST_MODULE_ID,
      tenant,
    );

    expect(featureList.items.map((item) => item.id)).toEqual([
      'block-feature-1',
      'block-feature-2',
    ]);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getFeatureList(MOCK_MISSING_ID, tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    await getFeatureList(MOCK_FEATURE_LIST_MODULE_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenNthCalledWith(1, featureListModuleQuery, {
      parameters: { id: MOCK_FEATURE_LIST_MODULE_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:featureList'),
          mockCacheTag(`module:${MOCK_FEATURE_LIST_MODULE_ID}`),
          mockCacheTag('block_feature'),
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
        ],
      },
    });
  });
});
