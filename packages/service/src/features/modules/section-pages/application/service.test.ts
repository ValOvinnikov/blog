import { BRAND_VARIANT } from '@blog/config/constants';
import { getSectionPagesModuleDocument } from '@blog/service/features/modules/section-pages/adaptor/module/loader';
import type { TSectionPagesModuleDocument } from '@blog/service/features/modules/section-pages/adaptor/module/types';
import { getSectionPages } from '@blog/service/features/modules/section-pages/adaptor/pages/loader';
import type { TSectionPageCard } from '@blog/service/features/modules/section-pages/adaptor/pages/types';
import {
  MOCK_SECTION_PAGES_MODULE_ID,
  MOCK_SECTION_PAGES_PARENT_ID,
  MOCK_SECTION_PAGES_PARENT_PATH,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { createSectionPagesModuleService } from './service';

vi.mock('@blog/service/features/modules/section-pages/adaptor/module/loader');
vi.mock('@blog/service/features/modules/section-pages/adaptor/pages/loader');

const mockGetModule = vi.mocked(getSectionPagesModuleDocument);
const mockGetPages = vi.mocked(getSectionPages);
const tenant = mockTenant();

const moduleDocument = {
  brandVariant: BRAND_VARIANT.PRIMARY,
} as unknown as TSectionPagesModuleDocument;
const pages = [{ id: 'page-faq' }] as unknown as TSectionPageCard[];

describe(createSectionPagesModuleService, () => {
  describe('v1.getSectionPagesModule', () => {
    beforeEach(() => {
      mockGetPages.mockResolvedValue(pages);
    });

    it('combines the module document with the children of the hosting page', async () => {
      mockGetModule.mockResolvedValue(moduleDocument);

      const result =
        await createSectionPagesModuleService().v1.getSectionPagesModule(
          MOCK_SECTION_PAGES_MODULE_ID,
          MOCK_SECTION_PAGES_PARENT_ID,
          MOCK_SECTION_PAGES_PARENT_PATH,
          tenant,
        );

      expect(result).toEqual({ ok: true, data: { ...moduleDocument, pages } });
      expect(mockGetModule).toHaveBeenCalledWith(
        MOCK_SECTION_PAGES_MODULE_ID,
        tenant,
      );
      expect(mockGetPages).toHaveBeenCalledWith(
        MOCK_SECTION_PAGES_PARENT_ID,
        MOCK_SECTION_PAGES_PARENT_PATH,
        tenant,
      );
    });

    it('resolves ok:false with the error when the module document fails', async () => {
      const error = mockValidationError();
      mockGetModule.mockRejectedValue(error);

      const result =
        await createSectionPagesModuleService().v1.getSectionPagesModule(
          MOCK_MISSING_ID,
          MOCK_SECTION_PAGES_PARENT_ID,
          MOCK_SECTION_PAGES_PARENT_PATH,
          tenant,
        );

      expect(result).toEqual({ ok: false, error });
    });
  });
});
