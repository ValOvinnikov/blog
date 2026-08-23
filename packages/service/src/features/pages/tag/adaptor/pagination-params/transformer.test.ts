import { toTagPaginationParams } from './transformer';

describe('toTagPaginationParams', () => {
  it('returns pages 2..totalPages for each tag page with a full corpus', () => {
    expect(
      toTagPaginationParams([
        { slug: 'typescript', postList: { pageSize: 9 }, postCount: 20 },
        { slug: 'react', postList: { pageSize: 9 }, postCount: 9 },
      ]),
    ).toEqual([
      { slug: 'typescript', page: '2' },
      { slug: 'typescript', page: '3' },
    ]);
  });

  it('contributes no entries for a tag page with zero posts', () => {
    expect(
      toTagPaginationParams([
        { slug: 'empty', postList: { pageSize: 9 }, postCount: 0 },
      ]),
    ).toEqual([]);
  });

  it('contributes no entries for a tag page that fits on one page', () => {
    expect(
      toTagPaginationParams([
        { slug: 'typescript', postList: { pageSize: 9 }, postCount: 5 },
      ]),
    ).toEqual([]);
  });

  // A tag page with no postList slot yet configured contributes no extra
  // pages rather than failing the whole site's static params — see the
  // rationale in transformer.ts.
  it('contributes no entries for a tag page with no postList slot set', () => {
    expect(
      toTagPaginationParams([
        { slug: 'unconfigured', postList: null, postCount: 20 },
      ]),
    ).toEqual([]);
  });

  it('returns an empty array when there are no tag pages', () => {
    expect(toTagPaginationParams([])).toEqual([]);
  });
});
