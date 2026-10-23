import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_STATS_MODULE_ID,
  mockRawStatsModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_HOME_PAGE_CACHE_TAG,
  MOCK_LINK_CACHE_TAG,
  MOCK_PAGE_LANDING_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getStatsModule } from './loader';
import { statsModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const HEADING = 'Our reach';
const tenant = mockTenant();

describe(getStatsModule, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawStatsModule({ headingBlock: mockRawHeadingBlock(HEADING) }),
    );
  });

  it('resolves the module in a single round trip', async () => {
    const stats = await getStatsModule(MOCK_STATS_MODULE_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(stats.headingBlock.heading).toBe(HEADING);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getStatsModule(MOCK_MISSING_ID, tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    await getStatsModule(MOCK_STATS_MODULE_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalledWith(statsModuleQuery, {
      parameters: { id: MOCK_STATS_MODULE_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          't:tenant-a:modules:stats',
          `t:tenant-a:module:${MOCK_STATS_MODULE_ID}`,
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
        ],
      },
    });
  });
});
