import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getIndexPagePagination } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getIndexPagePagination', () => {
  it('returns the post count and module refs as queried', async () => {
    const pagination = {
      blogPosts: { total: 20 },
      moduleRefs: [{ _ref: 'list-1' }],
    };
    mockRun.mockResolvedValueOnce(pagination);

    expect(await getIndexPagePagination(tenant)).toEqual(pagination);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValueOnce({
      blogPosts: { total: 0 },
      moduleRefs: null,
    });

    await getIndexPagePagination(tenant);

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
});
