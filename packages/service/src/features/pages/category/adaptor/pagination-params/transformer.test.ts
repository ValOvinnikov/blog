import { describe, expect, it } from 'vitest';

import { toCategoryPaginationParams } from './transformer';

describe('toCategoryPaginationParams', () => {
  it('returns pages 2..totalPages for each category with a full corpus', () => {
    expect(
      toCategoryPaginationParams(
        [
          { slug: 'engineering', total: 20 },
          { slug: 'design', total: 9 },
        ],
        9,
      ),
    ).toEqual([
      { slug: 'engineering', page: '2' },
      { slug: 'engineering', page: '3' },
    ]);
  });

  it('contributes no entries for a category with zero posts', () => {
    expect(
      toCategoryPaginationParams([{ slug: 'empty', total: 0 }], 9),
    ).toEqual([]);
  });

  it('contributes no entries for a category that fits on one page', () => {
    expect(
      toCategoryPaginationParams([{ slug: 'engineering', total: 5 }], 9),
    ).toEqual([]);
  });

  it('returns an empty array when there are no categories', () => {
    expect(toCategoryPaginationParams([], 9)).toEqual([]);
  });
});
