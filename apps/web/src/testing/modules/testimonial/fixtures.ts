import type { TTestimonialItem } from '@blog/service';
import { faker } from '@faker-js/faker';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

export const MOCK_TESTIMONIAL_MODULE_ID = 'testimonial-1';

export const mockTestimonialItem = (
  overrides: Partial<TTestimonialItem> = {},
): TTestimonialItem => ({
  id: MOCK_TESTIMONIAL_MODULE_ID,
  name: 'Jordan Reyes',
  quote: [mockPortableTextBlock('This product changed how our team ships.')],
  role: 'VP Engineering, Acme Co.',
  image: undefined,
  link: undefined,
  ...overrides,
});

export const MOCK_TESTIMONIAL_HEADING = 'What our customers say';

export const MOCK_TESTIMONIAL_ITEMS: TTestimonialItem[] = [
  mockTestimonialItem(),
  mockTestimonialItem({ id: faker.string.uuid(), name: 'Priya Nair' }),
];
