import { toTotalPages } from './to-total-pages';

describe(toTotalPages, () => {
  it('rounds a partial last page up to a whole page', () => {
    expect(toTotalPages(20, 9)).toBe(3);
  });
});
