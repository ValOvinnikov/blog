import { mockRun } from '@blog/service/testing/mock-run-query';

import { getTagPaginationParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getTagPaginationParams', () => {
  it('returns { slug, page } entries for pages 2..N per tag', async () => {
    mockRun
      .mockResolvedValueOnce([{ slug: 'typescript' }, { slug: 'react' }])
      .mockResolvedValueOnce({ posts: [], total: 20 })
      .mockResolvedValueOnce({ posts: [], total: 9 });

    const params = await getTagPaginationParams(9);

    expect(params).toEqual([
      { slug: 'typescript', page: '2' },
      { slug: 'typescript', page: '3' },
    ]);
  });

  it('returns an empty array when there are no tags', async () => {
    mockRun.mockResolvedValueOnce([]);

    const params = await getTagPaginationParams(9);

    expect(params).toEqual([]);
  });

  it('returns an empty array when every tag fits on one page', async () => {
    mockRun
      .mockResolvedValueOnce([{ slug: 'typescript' }])
      .mockResolvedValueOnce({ posts: [], total: 0 });

    const params = await getTagPaginationParams(9);

    expect(params).toEqual([]);
  });
});
