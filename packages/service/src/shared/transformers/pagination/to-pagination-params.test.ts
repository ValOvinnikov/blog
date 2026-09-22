import { toPaginationParams } from './to-pagination-params';

describe(toPaginationParams, () => {
  it('returns pages 2..totalPages for each page with a full corpus', () => {
    expect(
      toPaginationParams([
        { slug: 'typescript', pageSize: 9, postCount: 20 },
        { slug: 'react', pageSize: 9, postCount: 9 },
      ]),
    ).toEqual([
      { slug: 'typescript', page: '2' },
      { slug: 'typescript', page: '3' },
    ]);
  });

  it('contributes no entries for a page with zero posts', () => {
    expect(
      toPaginationParams([{ slug: 'empty', pageSize: 9, postCount: 0 }]),
    ).toEqual([]);
  });

  it('contributes no entries for a page that fits on one page', () => {
    expect(
      toPaginationParams([{ slug: 'typescript', pageSize: 9, postCount: 5 }]),
    ).toEqual([]);
  });

  it('contributes no entries for a page with no list module in modules[]', () => {
    expect(
      toPaginationParams([
        { slug: 'unconfigured', pageSize: null, postCount: 20 },
      ]),
    ).toEqual([]);
  });

  it('returns an empty array when there are no pages', () => {
    expect(toPaginationParams([])).toEqual([]);
  });
});
