import { mockRun } from '@blog/service/testing/mock-run-query';

import { getAuthorPaginationParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getAuthorPaginationParams', () => {
  it('returns { slug, page } entries for pages 2..N per author', async () => {
    mockRun.mockResolvedValueOnce([
      { slug: 'jane-doe', postCount: 20 },
      { slug: 'john-smith', postCount: 9 },
    ]);

    const params = await getAuthorPaginationParams(9);

    expect(params).toEqual([
      { slug: 'jane-doe', page: '2' },
      { slug: 'jane-doe', page: '3' },
    ]);
  });

  it('returns an empty array when there are no authors', async () => {
    mockRun.mockResolvedValueOnce([]);

    const params = await getAuthorPaginationParams(9);

    expect(params).toEqual([]);
  });

  it('returns an empty array when every author fits on one page', async () => {
    mockRun.mockResolvedValueOnce([{ slug: 'jane-doe', postCount: 0 }]);

    const params = await getAuthorPaginationParams(9);

    expect(params).toEqual([]);
  });
});
