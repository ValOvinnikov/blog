import { mockRun } from '@blog/service/testing/mock-run-query';

import { getTopicPaginationParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getTopicPaginationParams', () => {
  // Branch coverage (zero posts, single-page corpus, multi-page corpus) lives
  // in `./transformer.test.ts` — this loader has no logic beyond delegating
  // the raw query result to it.
  it('delegates the raw query result to the pagination transformer', async () => {
    mockRun.mockResolvedValueOnce([
      { slug: 'engineering', postCount: 20 },
      { slug: 'design', postCount: 9 },
    ]);

    const params = await getTopicPaginationParams(9);

    expect(params).toEqual([
      { slug: 'engineering', page: '2' },
      { slug: 'engineering', page: '3' },
    ]);
  });
});
