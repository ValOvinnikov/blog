import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@shinefold/config';
import type { TRawTestimonialModule } from '@shinefold/service/features/modules/testimonial/adaptor/transformer';
import {
  MOCK_PERSON_NAME,
  mockRawContentBlock,
} from '@shinefold/service/testing/modules/fixtures';
import { mockRawModuleHeadingBlock } from '@shinefold/service/testing/shared/localized';
import { mockRawModuleAppearance } from '@shinefold/service/testing/shared/module-appearance';

type TRawTestimonialItem = TRawTestimonialModule['testimonials'][number];

export const MOCK_TESTIMONIAL_MODULE_ID = 'testimonial-1';

export function mockRawTestimonialItem(
  overrides: Partial<TRawTestimonialItem> = {},
): TRawTestimonialItem {
  return {
    _id: 'block-testimonial-1',
    name: MOCK_PERSON_NAME,
    quote: [mockRawContentBlock({ text: 'Great work.' })],
    role: null,
    image: null,
    link: null,
    ...overrides,
  };
}

export function mockRawTestimonialModule(
  overrides: Partial<TRawTestimonialModule> = {},
): TRawTestimonialModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawModuleHeadingBlock('What people say'),
    testimonials: [
      mockRawTestimonialItem(),
      mockRawTestimonialItem({ _id: 'block-testimonial-2' }),
    ],
    ctaButtons: null,
    displayMode: DISPLAY_MODE.GRID,
    cardAlignment: CONTENT_ALIGNMENT.LEFT,
    contentAlignment: null,
    layout: null,
    ...mockRawModuleAppearance(),
    ...overrides,
  };
}
