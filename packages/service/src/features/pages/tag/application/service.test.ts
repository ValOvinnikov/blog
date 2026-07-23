import { getTagPage } from '@blog/service/features/pages/tag/adaptor/detail-page/loader';
import type { TTagPage } from '@blog/service/features/pages/tag/adaptor/detail-page/types';

import { createTagService } from './service';

vi.mock('@blog/service/features/pages/tag/adaptor/detail-page/loader');

const mockGetTagPage = vi.mocked(getTagPage);

describe('createTagService', () => {
  it('exposes v1.getTagPage as a function', () => {
    const svc = createTagService();
    expect(typeof svc.v1.getTagPage).toBe('function');
  });

  it('exposes v1.getTagParams as a function', () => {
    const svc = createTagService();
    expect(typeof svc.v1.getTagParams).toBe('function');
  });

  it('exposes v1.getTagPaginationParams as a function', () => {
    const svc = createTagService();
    expect(typeof svc.v1.getTagPaginationParams).toBe('function');
  });

  describe('v1.getTagPage', () => {
    it('resolves ok:true with the loader data on success', async () => {
      const page = { total: 1 } as unknown as TTagPage;
      mockGetTagPage.mockResolvedValue(page);

      const result = await createTagService().v1.getTagPage('news', {
        itemsPerPage: 10,
      });

      expect(result).toEqual({ ok: true, data: page });
    });

    it('resolves ok:true with null data when the tag is not found', async () => {
      mockGetTagPage.mockResolvedValue(null);

      const result = await createTagService().v1.getTagPage('missing', {
        itemsPerPage: 10,
      });

      expect(result).toEqual({ ok: true, data: null });
    });

    it('resolves ok:false with the error when the loader throws', async () => {
      const error = new Error('query failed');
      mockGetTagPage.mockRejectedValue(error);

      const result = await createTagService().v1.getTagPage('news', {
        itemsPerPage: 10,
      });

      expect(result).toEqual({ ok: false, error });
    });
  });
});
