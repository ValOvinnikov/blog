import { getSectionPagesModuleDocument } from '@blog/service/features/modules/section-pages/adaptor/module/loader';
import type { TSectionPagesModuleDocument } from '@blog/service/features/modules/section-pages/adaptor/module/types';
import { getSectionPages } from '@blog/service/features/modules/section-pages/adaptor/pages/loader';
import type { TSectionPageCard } from '@blog/service/features/modules/section-pages/adaptor/pages/types';
import { makeTenant } from '@blog/service/testing/tenant';

import { createSectionPagesModuleService } from './service';

vi.mock('@blog/service/features/modules/section-pages/adaptor/module/loader');
vi.mock('@blog/service/features/modules/section-pages/adaptor/pages/loader');

const mockGetModule = vi.mocked(getSectionPagesModuleDocument);
const mockGetPages = vi.mocked(getSectionPages);
const tenant = makeTenant();

const moduleDocument = {
  brandVariant: 'PRIMARY',
} as unknown as TSectionPagesModuleDocument;
const pages = [{ id: 'page-faq' }] as unknown as TSectionPageCard[];

describe('createSectionPagesModuleService', () => {
  describe('v1.getSectionPagesModule', () => {
    beforeEach(() => {
      mockGetPages.mockResolvedValue(pages);
    });

    it('combines the module document with the children of the hosting page', async () => {
      mockGetModule.mockResolvedValue(moduleDocument);

      const result =
        await createSectionPagesModuleService().v1.getSectionPagesModule(
          'section-pages-1',
          'page-modules',
          'modules',
          tenant,
        );

      expect(result).toEqual({ ok: true, data: { ...moduleDocument, pages } });
      expect(mockGetModule).toHaveBeenCalledWith('section-pages-1', tenant);
      expect(mockGetPages).toHaveBeenCalledWith(
        'page-modules',
        'modules',
        tenant,
      );
    });

    it('resolves ok:false with the error when the module document fails to load', async () => {
      const error = new Error('ValidationError');
      mockGetModule.mockRejectedValue(error);

      const result =
        await createSectionPagesModuleService().v1.getSectionPagesModule(
          'missing',
          'page-modules',
          'modules',
          tenant,
        );

      expect(result).toEqual({ ok: false, error });
    });
  });
});
