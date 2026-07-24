import { mockRun } from '@blog/service/testing/mock-run-query';

import { getCategoryPaginationParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getCategoryPaginationParams', () => {
  it('returns { slug, page } entries for pages 2..N per category', async () => {
    mockRun.mockResolvedValueOnce([
      { slug: 'engineering', postCount: 20 },
      { slug: 'design', postCount: 9 },
    ]);

    const params = await getCategoryPaginationParams(9);

    expect(params).toEqual([
      { slug: 'engineering', page: '2' },
      { slug: 'engineering', page: '3' },
    ]);
  });

  it('returns an empty array when there are no categories', async () => {
    mockRun.mockResolvedValueOnce([]);

    const params = await getCategoryPaginationParams(9);

    expect(params).toEqual([]);
  });

  it('returns an empty array when every category fits on one page', async () => {
    mockRun.mockResolvedValueOnce([{ slug: 'engineering', postCount: 0 }]);

    const params = await getCategoryPaginationParams(9);

    expect(params).toEqual([]);
  });
});
