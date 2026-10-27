import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_PRICING_MODULE_ID,
  mockRawPricingModule,
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

import { getPricingModule } from './loader';
import { pricingModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6014);

const MOCK_HEADING = faker.lorem.words(3);

describe(getPricingModule, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawPricingModule());
  });

  it('resolves the module in a single round trip', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawPricingModule({ headingBlock: mockRawHeadingBlock(MOCK_HEADING) }),
    );

    const pricing = await getPricingModule(MOCK_PRICING_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(pricing.headingBlock.heading).toBe(MOCK_HEADING);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getPricingModule(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    await getPricingModule(MOCK_PRICING_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(pricingModuleQuery, {
      parameters: { id: MOCK_PRICING_MODULE_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:pricing'),
          mockCacheTag(`module:${MOCK_PRICING_MODULE_ID}`),
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
        ],
      },
    });
  });
});
