import { mockRun } from '@blog/service/testing/mock-run-query';

import { getTagPaginationParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getTagPaginationParams', () => {
  // Branch coverage (zero posts, single-page corpus, multi-page corpus) lives
  // in `./transformer.test.ts` — this loader has no logic beyond delegating
  // the raw query result to it.
  it('delegates the raw query result to the pagination transformer', async () => {
    mockRun.mockResolvedValueOnce([
      { slug: 'typescript', postCount: 20 },
      { slug: 'react', postCount: 9 },
    ]);

    const params = await getTagPaginationParams(9);

    expect(params).toEqual([
      { slug: 'typescript', page: '2' },
      { slug: 'typescript', page: '3' },
    ]);
  });
});
