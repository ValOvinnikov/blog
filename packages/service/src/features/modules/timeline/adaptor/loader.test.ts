import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import {
  MOCK_TIMELINE_MODULE_ID,
  mockRawTimelineModule,
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

import { getTimelineModule } from './loader';
import { timelineModuleQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(1);

const MOCK_HEADING = faker.lorem.words(3);

describe(getTimelineModule, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawTimelineModule({
        headingBlock: mockRawModuleHeadingBlock(MOCK_HEADING),
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
          ...MOCK_LINK_TARGET_CACHE_TAGS,
        ],
      },
    });
  });
});
