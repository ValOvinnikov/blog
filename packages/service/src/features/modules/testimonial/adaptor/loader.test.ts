import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_TESTIMONIAL_MODULE_ID,
  mockRawTestimonialModule,
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

import { getTestimonialModule } from './loader';
import { testimonialModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const HEADING = 'Kind words';
const tenant = mockTenant();

describe(getTestimonialModule, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawTestimonialModule({ headingBlock: mockRawHeadingBlock(HEADING) }),
    );
  });

  it('resolves the module in a single round trip', async () => {
    const testimonial = await getTestimonialModule(
      MOCK_TESTIMONIAL_MODULE_ID,
      tenant,
    );

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(testimonial.headingBlock.heading).toBe(HEADING);
  });

  it('returns the referenced quotes in authored order', async () => {
    const testimonial = await getTestimonialModule(
      MOCK_TESTIMONIAL_MODULE_ID,
      tenant,
    );

    expect(testimonial.testimonials.map((item) => item.id)).toEqual([
      'block-testimonial-1',
      'block-testimonial-2',
    ]);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getTestimonialModule(MOCK_MISSING_ID, tenant),
    ).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    await getTestimonialModule(MOCK_TESTIMONIAL_MODULE_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalledWith(testimonialModuleQuery, {
      parameters: { id: MOCK_TESTIMONIAL_MODULE_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:testimonial'),
          mockCacheTag(`module:${MOCK_TESTIMONIAL_MODULE_ID}`),
          mockCacheTag('block_testimonial'),
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
        ],
      },
    });
  });
});
