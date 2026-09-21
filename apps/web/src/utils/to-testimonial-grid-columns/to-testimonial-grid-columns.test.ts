import { toTestimonialGridColumns } from './to-testimonial-grid-columns';

describe(toTestimonialGridColumns, () => {
  it.each([
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 2],
    [5, 3],
    [6, 3],
    [7, 3],
    [8, 2],
  ])('lays out %i items in %i columns', (itemCount, expectedColumns) => {
    expect(toTestimonialGridColumns(itemCount)).toBe(expectedColumns);
  });
});
