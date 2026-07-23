import { toAuthorPaginationParams } from './transformer';

describe('toAuthorPaginationParams', () => {
  it('returns pages 2..totalPages for each author with a full corpus', () => {
    expect(
      toAuthorPaginationParams(
        [
          { slug: 'jane-doe', total: 20 },
          { slug: 'john-smith', total: 9 },
        ],
        9,
      ),
    ).toEqual([
      { slug: 'jane-doe', page: '2' },
      { slug: 'jane-doe', page: '3' },
    ]);
  });

  it('contributes no entries for an author with zero posts', () => {
    expect(
      toAuthorPaginationParams([{ slug: 'empty-author', total: 0 }], 9),
    ).toEqual([]);
  });

  it('contributes no entries for an author that fits on one page', () => {
    expect(
      toAuthorPaginationParams([{ slug: 'jane-doe', total: 5 }], 9),
    ).toEqual([]);
  });

  it('returns an empty array when there are no authors', () => {
    expect(toAuthorPaginationParams([], 9)).toEqual([]);
  });
});
