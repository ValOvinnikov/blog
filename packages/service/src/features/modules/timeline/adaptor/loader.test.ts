import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_TIMELINE_MODULE_ID,
  mockRawTimelineModule,
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

import { getTimelineModule } from './loader';
import { timelineModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(1);

const MOCK_HEADING = faker.lorem.words(3);

describe(getTimelineModule, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawTimelineModule({
        headingBlock: mockRawHeadingBlock(MOCK_HEADING),
      }),
    );
  });

  it('resolves the module in a single round trip', async () => {
    const timeline = await getTimelineModule(
      MOCK_TIMELINE_MODULE_ID,
      MOCK_TENANT,
    );

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(timeline.headingBlock.heading).toBe(MOCK_HEADING);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getTimelineModule(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('queries with the tenant and the cache tags scoped to it', async () => {
    await getTimelineModule(MOCK_TIMELINE_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(timelineModuleQuery, {
      parameters: { id: MOCK_TIMELINE_MODULE_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:timeline'),
          mockCacheTag(`module:${MOCK_TIMELINE_MODULE_ID}`),
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
        ],
      },
    });
  });
});
