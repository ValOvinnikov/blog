import { toTagPaginationParams } from './transformer';

describe('toTagPaginationParams', () => {
  it('returns pages 2..totalPages for each tag with a full corpus', () => {
    expect(
      toTagPaginationParams(
        [
          { slug: 'typescript', total: 20 },
          { slug: 'react', total: 9 },
        ],
        9,
      ),
    ).toEqual([
      { slug: 'typescript', page: '2' },
      { slug: 'typescript', page: '3' },
    ]);
  });

  it('contributes no entries for a tag with zero posts', () => {
    expect(toTagPaginationParams([{ slug: 'empty', total: 0 }], 9)).toEqual([]);
  });

  it('contributes no entries for a tag that fits on one page', () => {
    expect(
      toTagPaginationParams([{ slug: 'typescript', total: 5 }], 9),
    ).toEqual([]);
  });

  it('returns an empty array when there are no tags', () => {
    expect(toTagPaginationParams([], 9)).toEqual([]);
  });
});
