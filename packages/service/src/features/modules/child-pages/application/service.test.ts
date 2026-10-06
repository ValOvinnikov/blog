import { getChildPagesModuleDocument } from '@blog/service/features/modules/child-pages/adaptor/module/loader';
import type { TChildPagesModuleDocument } from '@blog/service/features/modules/child-pages/adaptor/module/types';
import { getChildPages } from '@blog/service/features/modules/child-pages/adaptor/pages/loader';
import type { TChildPageCard } from '@blog/service/features/modules/child-pages/adaptor/pages/types';
import { makeTenant } from '@blog/service/testing/tenant';

import { createChildPagesModuleService } from './service';

vi.mock('@blog/service/features/modules/child-pages/adaptor/module/loader');
vi.mock('@blog/service/features/modules/child-pages/adaptor/pages/loader');

const mockGetModule = vi.mocked(getChildPagesModuleDocument);
const mockGetPages = vi.mocked(getChildPages);
const tenant = makeTenant();

const moduleDocument = {
  brandVariant: 'PRIMARY',
} as unknown as TChildPagesModuleDocument;
const pages = [{ id: 'page-faq' }] as unknown as TChildPageCard[];

describe('createChildPagesModuleService', () => {
  describe('v1.getChildPagesModule', () => {
    it('combines the module document with the children of the hosting page', async () => {
      mockGetModule.mockResolvedValue(moduleDocument);
      mockGetPages.mockResolvedValue(pages);

      const result =
        await createChildPagesModuleService().v1.getChildPagesModule(
          'child-pages-1',
          'page-modules',
          'modules',
          tenant,
        );

      expect(result).toEqual({ ok: true, data: { ...moduleDocument, pages } });
      expect(mockGetModule).toHaveBeenCalledWith('child-pages-1', tenant);
      expect(mockGetPages).toHaveBeenCalledWith(
        'page-modules',
        'modules',
        tenant,
      );
    });

    it('resolves ok:false with the error when the module document fails to load', async () => {
      const error = new Error('ValidationError');
      mockGetModule.mockRejectedValue(error);
      mockGetPages.mockResolvedValue(pages);

      const result =
        await createChildPagesModuleService().v1.getChildPagesModule(
          'missing',
          'page-modules',
          'modules',
          tenant,
        );

      expect(result).toEqual({ ok: false, error });
    });
  });
});
