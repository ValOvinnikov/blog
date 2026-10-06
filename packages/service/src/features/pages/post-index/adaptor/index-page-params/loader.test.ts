import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getIndexPageParams } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getIndexPageParams', () => {
  it('delegates the raw query result to the pagination transformer', async () => {
    mockRun
      .mockResolvedValueOnce({
        blogPosts: { total: 20 },
        moduleRefs: [{ _ref: 'hero-1' }, { _ref: 'list-1' }],
      })
      .mockResolvedValueOnce([{ _id: 'list-1', pageSize: 9 }]);

    const params = await getIndexPageParams(tenant);

    expect(params).toEqual([{ page: '2' }, { page: '3' }]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValueOnce({
      blogPosts: { total: 0 },
      moduleRefs: null,
    });

    await getIndexPageParams(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:posts',
            't:tenant-a:page_postIndex',
            't:tenant-a:template_postIndex',
          ],
        }),
      }),
    );
  });

  it('returns no extra pages when the page has no post list module', async () => {
    mockRun
      .mockResolvedValueOnce({
        blogPosts: { total: 200 },
        moduleRefs: [{ _ref: 'hero-1' }],
      })
      .mockResolvedValueOnce([]);

    expect(await getIndexPageParams(tenant)).toEqual([]);
  });
});
