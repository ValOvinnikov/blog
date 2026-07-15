import { describe, expect, it } from 'vitest';

import { toIndexPageParams } from './transformer';

describe('toIndexPageParams', () => {
  it('returns pages 2..totalPages for a full corpus', () => {
    expect(
      toIndexPageParams({ blogPosts: { total: 20 }, itemsPerPage: 9 }),
    ).toEqual([{ page: '2' }, { page: '3' }]);
  });

  it('returns an empty array when the corpus fits on one page', () => {
    expect(
      toIndexPageParams({ blogPosts: { total: 9 }, itemsPerPage: 9 }),
    ).toEqual([]);
  });

  it('returns an empty array when there is no content', () => {
    expect(
      toIndexPageParams({ blogPosts: { total: 0 }, itemsPerPage: 9 }),
    ).toEqual([]);
  });
});
