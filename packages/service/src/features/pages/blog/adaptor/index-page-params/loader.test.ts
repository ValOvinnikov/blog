import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getIndexPageParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getIndexPageParams', () => {
  // Branch coverage (empty corpus, single-page corpus, multi-page corpus)
  // lives in `./transformer.test.ts` — this loader has no logic beyond
  // delegating the raw query result to it.
  it('delegates the raw query result to the pagination transformer', async () => {
    mockRun.mockResolvedValueOnce({
      blogPosts: { total: 20 },
      postList: { pageSize: 9 },
    });

    const params = await getIndexPageParams(tenant);

    expect(params).toEqual([{ page: '2' }, { page: '3' }]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValueOnce({
      blogPosts: { total: 0 },
      postList: { pageSize: 9 },
    });

    await getIndexPageParams(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:posts',
            't:tenant-a:page_blog',
            't:tenant-a:modules:postList',
          ],
        }),
      }),
    );
  });
});
