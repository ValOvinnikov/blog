import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { TTestimonialItem, TTestimonialModule } from '@blog/service';
import { createMockFaker } from '@web/testing/mock-faker';
import { MOCK_TEAM_MEMBER_NAME } from '@web/testing/modules/team/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

const mockFaker = createMockFaker(61040);

export const MOCK_TESTIMONIAL_MODULE_ID = 'testimonial-1';

export const MOCK_TESTIMONIAL_QUOTE =
  'This product changed how our team ships.';

export const MOCK_TESTIMONIAL_ROLE = 'VP Engineering, Acme Co.';

export const mockTestimonialItem = (
  overrides: Partial<TTestimonialItem> = {},
): TTestimonialItem => ({
  id: MOCK_TESTIMONIAL_MODULE_ID,
  name: MOCK_TEAM_MEMBER_NAME,
  quote: [mockPortableTextBlock(MOCK_TESTIMONIAL_QUOTE)],
  role: MOCK_TESTIMONIAL_ROLE,
  image: undefined,
  link: undefined,
  ...overrides,
});

export const MOCK_TESTIMONIAL_HEADING = 'What our customers say';

export const MOCK_TESTIMONIAL_ITEMS: TTestimonialItem[] = [
  mockTestimonialItem(),
  mockTestimonialItem({ id: mockFaker.string.uuid(), name: 'Priya Nair' }),
];

export const mockTestimonialModule = (
  overrides: Partial<TTestimonialModule> = {},
): TTestimonialModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_TESTIMONIAL_HEADING }),
  testimonials: MOCK_TESTIMONIAL_ITEMS,
  ctaButtons: [],
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  ...overrides,
});
