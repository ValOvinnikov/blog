import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getTopicPaginationParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getTopicPaginationParams', () => {
  // Branch coverage (zero posts, single-page corpus, multi-page corpus,
  // missing postList) lives in `./transformer.test.ts` — this loader has no
  // logic beyond delegating the raw query result to it.
  it('delegates the raw query result to the pagination transformer', async () => {
    mockRun.mockResolvedValueOnce([
      { slug: 'engineering', postList: { pageSize: 9 }, postCount: 20 },
      { slug: 'design', postList: { pageSize: 9 }, postCount: 9 },
    ]);

    const params = await getTopicPaginationParams(tenant);

    expect(params).toEqual([
      { slug: 'engineering', page: '2' },
      { slug: 'engineering', page: '3' },
    ]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValueOnce([]);

    await getTopicPaginationParams(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:page_topic',
            't:tenant-a:modules:postList',
            't:tenant-a:posts',
            't:tenant-a:topic',
          ],
        }),
      }),
    );
  });
});
