import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_TESTIMONIAL_MODULE_ID,
  mockRawTestimonialItem,
  mockRawTestimonialModule,
} from '@blog/service/testing/modules/testimonial/fixtures';
import {
  MOCK_LINK_TARGET_CACHE_TAGS,
  mockCacheTag,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getTestimonialModule } from './loader';
import { testimonialModuleQuery } from './query';
import type { TTestimonialModule } from './types';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6014);

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_FIRST_QUOTE_ID = faker.string.uuid();
const MOCK_SECOND_QUOTE_ID = faker.string.uuid();

describe(getTestimonialModule, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawTestimonialModule({
        headingBlock: mockRawHeadingBlock(MOCK_HEADING),
        testimonials: [
          mockRawTestimonialItem({ _id: MOCK_FIRST_QUOTE_ID }),
          mockRawTestimonialItem({ _id: MOCK_SECOND_QUOTE_ID }),
        ],
      }),
    );
  });

  describe('for a module with two quotes', () => {
    let testimonial: TTestimonialModule;

    beforeEach(async () => {
      testimonial = await getTestimonialModule(
        MOCK_TESTIMONIAL_MODULE_ID,
        MOCK_TENANT,
      );
    });

    it('resolves the module in a single round trip', () => {
      expect(mockRun).toHaveBeenCalledTimes(1);
      expect(testimonial.headingBlock.heading).toBe(MOCK_HEADING);
    });

    it('returns the referenced quotes in authored order', () => {
      expect(testimonial.testimonials.map((item) => item.id)).toEqual([
        MOCK_FIRST_QUOTE_ID,
        MOCK_SECOND_QUOTE_ID,
      ]);
    });
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getTestimonialModule(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    await getTestimonialModule(MOCK_TESTIMONIAL_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(testimonialModuleQuery, {
      parameters: { id: MOCK_TESTIMONIAL_MODULE_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:testimonial'),
          mockCacheTag(`module:${MOCK_TESTIMONIAL_MODULE_ID}`),
          mockCacheTag('block_testimonial'),
          ...MOCK_LINK_TARGET_CACHE_TAGS,
        ],
      },
    });
  });
});
