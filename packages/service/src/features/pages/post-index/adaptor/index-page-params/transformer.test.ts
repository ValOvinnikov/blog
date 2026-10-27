import { MOCK_POST_LIST_PAGE_SIZE } from '@blog/service/testing/modules/fixtures';

import { toIndexPageParams } from './transformer';

describe(toIndexPageParams, () => {
  it.each([
    [
      'pages 2 through the last for a full corpus',
      20,
      [{ page: '2' }, { page: '3' }],
    ],
    ['no pages when the corpus fits on one page', MOCK_POST_LIST_PAGE_SIZE, []],
    ['no pages when there is no content', 0, []],
  ])('returns %s', (_, total, expected) => {
    const params = toIndexPageParams({
      blogPosts: { total },
      pageSize: MOCK_POST_LIST_PAGE_SIZE,
    });

    expect(params).toEqual(expected);
  });

  it('returns no pages without a page size, however large the corpus', () => {
    const params = toIndexPageParams({
      blogPosts: { total: 200 },
      pageSize: null,
    });

    expect(params).toEqual([]);
  });
});
