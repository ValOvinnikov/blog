import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getTagPaginationParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getTagPaginationParams', () => {
  // Branch coverage (zero posts, single-page corpus, multi-page corpus,
  // missing postList) lives in `./transformer.test.ts` — this loader has no
  // logic beyond delegating the raw query result to it.
  it('delegates the raw query result to the pagination transformer', async () => {
    mockRun.mockResolvedValueOnce([
      { slug: 'typescript', postList: { pageSize: 9 }, postCount: 20 },
      { slug: 'react', postList: { pageSize: 9 }, postCount: 9 },
    ]);

    const params = await getTagPaginationParams(tenant);

    expect(params).toEqual([
      { slug: 'typescript', page: '2' },
      { slug: 'typescript', page: '3' },
    ]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValueOnce([]);

    await getTagPaginationParams(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:page_tag',
            't:tenant-a:modules:postList',
            't:tenant-a:posts',
            't:tenant-a:tag',
          ],
        }),
      }),
    );
  });
});
