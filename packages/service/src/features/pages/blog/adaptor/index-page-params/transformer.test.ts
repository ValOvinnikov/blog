import { MissingPostListError } from '@blog/service/features/pages/blog/adaptor/missing-post-list-error';

import { toIndexPageParams } from './transformer';

describe('toIndexPageParams', () => {
  it('returns pages 2..totalPages for a full corpus', () => {
    expect(
      toIndexPageParams({
        blogPosts: { total: 20 },
        postList: { pageSize: 9 },
      }),
    ).toEqual([{ page: '2' }, { page: '3' }]);
  });

  it('returns an empty array when the corpus fits on one page', () => {
    expect(
      toIndexPageParams({
        blogPosts: { total: 9 },
        postList: { pageSize: 9 },
      }),
    ).toEqual([]);
  });

  it('returns an empty array when there is no content', () => {
    expect(
      toIndexPageParams({
        blogPosts: { total: 0 },
        postList: { pageSize: 9 },
      }),
    ).toEqual([]);
  });

  // Regression guard for the decision that a missing slot is a loud failure,
  // never a substituted default page size.
  it('throws MissingPostListError when postList is unset, rather than defaulting the page size', () => {
    expect(() =>
      toIndexPageParams({ blogPosts: { total: 20 }, postList: null }),
    ).toThrow(MissingPostListError);
  });
});
