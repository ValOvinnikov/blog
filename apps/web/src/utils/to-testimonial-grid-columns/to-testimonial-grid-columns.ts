const TESTIMONIAL_GRID_COLUMNS_BY_ITEM_COUNT: Record<number, 1 | 2 | 3> = {
  1: 1,
  2: 2,
  3: 3,
  4: 2,
  5: 3,
  6: 3,
  7: 3,
  8: 2,
};

export const toTestimonialGridColumns = (itemCount: number): 1 | 2 | 3 =>
  TESTIMONIAL_GRID_COLUMNS_BY_ITEM_COUNT[itemCount] ?? 3;
