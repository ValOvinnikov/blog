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
      postList: { pageSize: 9 },
    });

    const params = await getIndexPageParams();

    expect(params).toEqual([{ page: '2' }, { page: '3' }]);
  });

  it('tags the query with modules:postList alongside posts/page_blog', async () => {
    mockRun.mockResolvedValueOnce({
      blogPosts: { total: 0 },
      postList: { pageSize: 9 },
    });

    await getIndexPageParams();

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: ['posts', 'page_blog', 'modules:postList'],
        }),
      }),
    );
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValueOnce({
      blogPosts: { total: 0 },
      postList: { pageSize: 9 },
    });
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok',
    };

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

  it('omits tenant scoping when no tenant is given (legacy behavior unchanged)', async () => {
    mockRun.mockResolvedValueOnce({
      blogPosts: { total: 0 },
      postList: { pageSize: 9 },
    });

    await getIndexPageParams();

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenant: undefined }),
    );
  });
});
