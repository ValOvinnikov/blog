import { getCategoryPage } from '@blog/service/features/pages/category/adaptor/detail-page/loader';
import type { TCategoryPage } from '@blog/service/features/pages/category/adaptor/detail-page/types';

import { createCategoryService } from './service';

vi.mock('@blog/service/features/pages/category/adaptor/detail-page/loader');

const mockGetCategoryPage = vi.mocked(getCategoryPage);

describe('createCategoryService', () => {
  it('exposes v1.getCategoryPage as a function', () => {
    const svc = createCategoryService();
    expect(typeof svc.v1.getCategoryPage).toBe('function');
  });

  it('exposes v1.getCategoryParams as a function', () => {
    const svc = createCategoryService();
    expect(typeof svc.v1.getCategoryParams).toBe('function');
  });

  it('exposes v1.getCategoryPaginationParams as a function', () => {
    const svc = createCategoryService();
    expect(typeof svc.v1.getCategoryPaginationParams).toBe('function');
  });

  describe('v1.getCategoryPage', () => {
    it('resolves ok:true with the loader data on success', async () => {
      const page = { total: 1 } as unknown as TCategoryPage;
      mockGetCategoryPage.mockResolvedValue(page);

      const result = await createCategoryService().v1.getCategoryPage(
        'engineering',
        { itemsPerPage: 10 },
      );

      expect(result).toEqual({ ok: true, data: page });
    });

    it('resolves ok:true with null data when the category is not found', async () => {
      mockGetCategoryPage.mockResolvedValue(null);

      const result = await createCategoryService().v1.getCategoryPage(
        'missing',
        { itemsPerPage: 10 },
      );

      expect(result).toEqual({ ok: true, data: null });
    });

    it('resolves ok:false with the error when the loader throws', async () => {
      const error = new Error('query failed');
      mockGetCategoryPage.mockRejectedValue(error);

      const result = await createCategoryService().v1.getCategoryPage(
        'engineering',
        { itemsPerPage: 10 },
      );

      expect(result).toEqual({ ok: false, error });
    });
  });
});
