import { mockRun } from '@blog/service/testing/mock-run-query';

import { getAuthorPaginationParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));
vi.mock(
  '@blog/service/features/entities/author/adaptor/detail-page-params/loader',
  () => ({
    getAuthorParams: vi.fn(),
  }),
);

const { getAuthorParams } =
  await import('@blog/service/features/entities/author/adaptor/detail-page-params/loader');

describe('getAuthorPaginationParams', () => {
  it('returns { slug, page } entries for pages 2..N per author', async () => {
    vi.mocked(getAuthorParams).mockResolvedValueOnce([
      { slug: 'jane-doe' },
      { slug: 'john-smith' },
    ]);
    mockRun
      .mockResolvedValueOnce({ posts: [], total: 20 })
      .mockResolvedValueOnce({ posts: [], total: 9 });

    const params = await getAuthorPaginationParams(9);

    expect(params).toEqual([
      { slug: 'jane-doe', page: '2' },
      { slug: 'jane-doe', page: '3' },
    ]);
  });

  it('returns an empty array when there are no authors', async () => {
    vi.mocked(getAuthorParams).mockResolvedValueOnce([]);

    const params = await getAuthorPaginationParams(9);

    expect(params).toEqual([]);
  });

  it('returns an empty array when every author fits on one page', async () => {
    vi.mocked(getAuthorParams).mockResolvedValueOnce([{ slug: 'jane-doe' }]);
    mockRun.mockResolvedValueOnce({ posts: [], total: 0 });

    const params = await getAuthorPaginationParams(9);

    expect(params).toEqual([]);
  });
});
