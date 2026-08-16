import { mockRun } from '@blog/service/testing/mock-run-query';

import { getIndexPageParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getIndexPageParams', () => {
  // Branch coverage (empty corpus, single-page corpus, multi-page corpus)
  // lives in `./transformer.test.ts` — this loader has no logic beyond
  // delegating the raw query result to it.
  it('delegates the raw query result to the pagination transformer', async () => {
    mockRun.mockResolvedValueOnce({
      blogPosts: { total: 20 },
      itemsPerPage: 9,
    });

    const params = await getIndexPageParams();

    expect(params).toEqual([{ page: '2' }, { page: '3' }]);
  });
});
