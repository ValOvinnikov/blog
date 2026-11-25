import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import {
  MOCK_STATS_MODULE_ID,
  mockRawStatsModule,
} from '@shinefold/service/testing/modules/fixtures';
import {
  MOCK_LINK_TARGET_CACHE_TAGS,
  mockCacheTag,
} from '@shinefold/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@shinefold/service/testing/shared/fixtures';
import { mockRawModuleHeadingBlock } from '@shinefold/service/testing/shared/localized';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { getStatsModule } from './loader';
import { statsModuleQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(1);

const MOCK_HEADING = faker.lorem.words(3);

describe(getStatsModule, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawStatsModule({
        headingBlock: mockRawModuleHeadingBlock(MOCK_HEADING),
      }),
    );
  });

  it('resolves the module in a single round trip', async () => {
    const stats = await getStatsModule(MOCK_STATS_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(stats.headingBlock.heading).toBe(MOCK_HEADING);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getStatsModule(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('queries with the tenant and the cache tags scoped to it', async () => {
    await getStatsModule(MOCK_STATS_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(statsModuleQuery, {
      parameters: { id: MOCK_STATS_MODULE_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:stats'),
          mockCacheTag(`module:${MOCK_STATS_MODULE_ID}`),
          ...MOCK_LINK_TARGET_CACHE_TAGS,
        ],
      },
    });
  });
});
