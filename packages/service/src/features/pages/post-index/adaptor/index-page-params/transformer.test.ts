import { toIndexPageParams } from './transformer';

describe('toIndexPageParams', () => {
  it('returns pages 2..totalPages for a full corpus', () => {
    expect(
      toIndexPageParams({ blogPosts: { total: 20 }, pageSize: 9 }),
    ).toEqual([{ page: '2' }, { page: '3' }]);
  });

  it('returns an empty array when the corpus fits on one page', () => {
    expect(toIndexPageParams({ blogPosts: { total: 9 }, pageSize: 9 })).toEqual(
      [],
    );
  });

  it('returns an empty array when there is no content', () => {
    expect(toIndexPageParams({ blogPosts: { total: 0 }, pageSize: 9 })).toEqual(
      [],
    );
  });

  // Regression guard for the decision that an unauthored list module is
  // never a substituted page size: no module_postList in modules[] means
  // a single, unpaginated page, however large the corpus is.
  it('returns an empty array when modules[] has no module_postList entry, regardless of corpus size', () => {
    expect(
      toIndexPageParams({ blogPosts: { total: 200 }, pageSize: null }),
    ).toEqual([]);
  });
});
