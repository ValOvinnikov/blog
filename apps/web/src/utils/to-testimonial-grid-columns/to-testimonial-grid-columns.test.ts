import { toTestimonialGridColumns } from './to-testimonial-grid-columns';

describe(toTestimonialGridColumns, () => {
  it.each([1, 9])(
    'falls back to 3 columns for a count outside the mapped range: %i',
    (count) => {
      expect(toTestimonialGridColumns(count)).toBe(3);
    },
  );

  it.each(Array.from({ length: 7 }, (_, index) => index + 2))(
    'caps a mapped count at 2 or 3 columns and never exceeds the item count: %i',
    (count) => {
      const columns = toTestimonialGridColumns(count);

      expect([2, 3]).toContain(columns);
      expect(columns).toBeLessThanOrEqual(count);
    },
  );
});
