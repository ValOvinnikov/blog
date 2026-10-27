import type { TTestimonialItem } from '@blog/service';
import { faker } from '@faker-js/faker';
import { MOCK_TEAM_MEMBER_NAME } from '@web/testing/modules/team/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

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
  mockTestimonialItem({ id: faker.string.uuid(), name: 'Priya Nair' }),
];
