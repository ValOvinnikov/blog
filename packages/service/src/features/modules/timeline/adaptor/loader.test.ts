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
import { mockTenant } from '@blog/service/testing/tenant';

import { getTimelineModule } from './loader';
import { timelineModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const HEADING = 'Our story';
const tenant = mockTenant();

describe(getTimelineModule, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawTimelineModule({ headingBlock: mockRawHeadingBlock(HEADING) }),
    );
  });

  it('resolves the module in a single round trip', async () => {
    const timeline = await getTimelineModule(MOCK_TIMELINE_MODULE_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(timeline.headingBlock.heading).toBe(HEADING);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getTimelineModule(MOCK_MISSING_ID, tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    await getTimelineModule(MOCK_TIMELINE_MODULE_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalledWith(timelineModuleQuery, {
      parameters: { id: MOCK_TIMELINE_MODULE_ID },
      tenant,
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
