import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_FEATURE_LIST_MODULE_ID,
  mockRawFeatureListItem,
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
import { MOCK_TENANT } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getFeatureList } from './loader';
import { featureListModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(1);

const MOCK_FEATURE_LIST_HEADING = faker.lorem.words(3);
const MOCK_FIRST_CARD_ID = faker.string.uuid();
const MOCK_SECOND_CARD_ID = faker.string.uuid();

describe(getFeatureList, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawFeatureListModule({
        headingBlock: mockRawHeadingBlock(MOCK_FEATURE_LIST_HEADING),
        features: [
          mockRawFeatureListItem({ _id: MOCK_FIRST_CARD_ID }),
          mockRawFeatureListItem({ _id: MOCK_SECOND_CARD_ID }),
        ],
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

  it('returns the referenced cards in authored order', async () => {
    const featureList = await getFeatureList(
      MOCK_FEATURE_LIST_MODULE_ID,
      MOCK_TENANT,
    );

    expect(featureList.items.map((item) => item.id)).toEqual([
      MOCK_FIRST_CARD_ID,
      MOCK_SECOND_CARD_ID,
    ]);
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
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
        ],
      },
    });
  });
});
