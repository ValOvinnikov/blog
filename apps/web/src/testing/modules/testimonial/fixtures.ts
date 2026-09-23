import type { TTestimonialItem } from '@blog/service';
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';

export const makeTestimonialItem = (
  overrides: Partial<TTestimonialItem> = {},
): TTestimonialItem => ({
  id: 'testimonial-1',
  name: 'Jordan Reyes',
  quote: [portableTextBlock('This product changed how our team ships.')],
  role: 'VP Engineering, Acme Co.',
  image: undefined,
  link: undefined,
  ...overrides,
});
