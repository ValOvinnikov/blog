import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_HERO_MODULE_ID,
  MOCK_LIST_MODULE_ID,
  mockListModulePageSize,
} from '@blog/service/testing/pages/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { createBlogService } from './service';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();

describe(createBlogService, () => {
  describe('v1.getIndexPageParams', () => {
    it('pages each page by the page size of its first post list module', async () => {
      mockRun
        .mockResolvedValueOnce({
          blogPosts: { total: 20 },
          moduleRefs: [
            { _ref: MOCK_HERO_MODULE_ID },
            { _ref: MOCK_LIST_MODULE_ID },
          ],
        })
        .mockResolvedValueOnce([mockListModulePageSize()]);

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
          moduleRefs: [{ _ref: MOCK_HERO_MODULE_ID }],
        })
        .mockResolvedValueOnce([]);

      const result = await createBlogService().v1.getIndexPageParams(tenant);

      expect(result).toEqual({ ok: true, data: [] });
    });
  });
});
