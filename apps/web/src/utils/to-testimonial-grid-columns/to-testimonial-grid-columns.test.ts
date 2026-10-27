import { toTestimonialGridColumns } from './to-testimonial-grid-columns';

const MIN_MAPPED_COUNT = 2;
const MAPPED_COUNT_SPAN = 7;

describe(toTestimonialGridColumns, () => {
  it.each([1, 9])(
    'falls back to 3 columns for a count outside the mapped range: %i',
    (count) => {
      expect(toTestimonialGridColumns(count)).toBe(3);
    },
  );

  it.each(
    Array.from(
      { length: MAPPED_COUNT_SPAN },
      (_, index) => index + MIN_MAPPED_COUNT,
    ),
  )('uses 2 or 3 columns, never more than the items, for %i items', (count) => {
    const columns = toTestimonialGridColumns(count);

    expect([2, 3]).toContain(columns);
    expect(columns).toBeLessThanOrEqual(count);
  });
});
