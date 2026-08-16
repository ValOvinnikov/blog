import { mockRun } from '@blog/service/testing/mock-run-query';

import { getAuthorPaginationParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getAuthorPaginationParams', () => {
  // Branch coverage (zero posts, single-page corpus, multi-page corpus) lives
  // in `./transformer.test.ts` — this loader has no logic beyond delegating
  // the raw query result to it.
  it('delegates the raw query result to the pagination transformer', async () => {
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
});
