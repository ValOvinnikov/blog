import { describe, expect, it } from 'vitest';

import { toIndexPageParams } from './transformer';

describe('toIndexPageParams', () => {
  it('returns pages 2..totalPages for a full corpus', () => {
    expect(toIndexPageParams({ total: 20, itemsPerPage: 9 })).toEqual([
      { page: '2' },
      { page: '3' },
    ]);
  });

  it('returns an empty array when the corpus fits on one page', () => {
    expect(toIndexPageParams({ total: 9, itemsPerPage: 9 })).toEqual([]);
  });

  it('returns an empty array when there is no content', () => {
    expect(toIndexPageParams({ total: 0, itemsPerPage: 9 })).toEqual([]);
  });

  it('falls back to POSTS_PER_PAGE when itemsPerPage is absent', () => {
    expect(toIndexPageParams({ total: 20, itemsPerPage: null })).toEqual([
      { page: '2' },
      { page: '3' },
    ]); // ceil(20 / 9)
  });
});
