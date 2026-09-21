import type { TTestimonialItem } from '@blog/service';
import type { TTestimonialCardItem } from '@web/modules/testimonial/testimonial-card';

export const makeTestimonialItem = (
  overrides: Partial<TTestimonialItem> = {},
): TTestimonialItem => ({
  id: 'testimonial-1',
  quote: 'This product changed how we ship.',
  name: 'Ada Lovelace',
  role: 'Head of Engineering, Acme',
  photo: undefined,
  link: undefined,
  ...overrides,
});

export const makeTestimonialCardItem = (
  overrides: Partial<TTestimonialCardItem> = {},
): TTestimonialCardItem => ({
  id: 'testimonial-1',
  quote: 'This product changed how we ship.',
  name: 'Ada Lovelace',
  role: 'Head of Engineering, Acme',
  avatarSrc: undefined,
  avatarAlt: undefined,
  link: undefined,
  ...overrides,
});
