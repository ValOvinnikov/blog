import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { createBlogService } from './service';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('createBlogService', () => {
  describe('v1.getIndexPageParams', () => {
    it('pages each page by the page size of its first post list module', async () => {
      mockRun
        .mockResolvedValueOnce({
          blogPosts: { total: 20 },
          moduleRefs: [{ _ref: 'hero-1' }, { _ref: 'list-1' }],
        })
        .mockResolvedValueOnce([{ _id: 'list-1', pageSize: 9 }]);

      const result = await createBlogService().v1.getIndexPageParams(tenant);

      expect(result).toEqual({
        ok: true,
        data: [{ page: '2' }, { page: '3' }],
      });
    });

    it('returns no extra pages when the page has no post list module', async () => {
      mockRun
        .mockResolvedValueOnce({
          blogPosts: { total: 200 },
          moduleRefs: [{ _ref: 'hero-1' }],
        })
        .mockResolvedValueOnce([]);

      expect(await createBlogService().v1.getIndexPageParams(tenant)).toEqual({
        ok: true,
        data: [],
      });
    });
  });
});
