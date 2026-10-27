import { getSectionPagesModuleDocument } from '@blog/service/features/modules/section-pages/adaptor/module/loader';
import { toSectionPagesModuleDocument } from '@blog/service/features/modules/section-pages/adaptor/module/transformer';
import { getSectionPages } from '@blog/service/features/modules/section-pages/adaptor/pages/loader';
import { toSectionPageCards } from '@blog/service/features/modules/section-pages/adaptor/pages/transformer';
import {
  MOCK_SECTION_PAGES_MODULE_ID,
  MOCK_SECTION_PAGES_PARENT_ID,
  MOCK_SECTION_PAGES_PARENT_PATH,
  mockRawSectionPage,
  mockRawSectionPagesModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@blog/service/testing/tenant';

import { createSectionPagesModuleService } from './service';

vi.mock('@blog/service/features/modules/section-pages/adaptor/module/loader');
vi.mock('@blog/service/features/modules/section-pages/adaptor/pages/loader');

const MOCK_MODULE_DOCUMENT = toSectionPagesModuleDocument(
  mockRawSectionPagesModule(),
);
const MOCK_PAGES = toSectionPageCards(
  [mockRawSectionPage()],
  MOCK_SECTION_PAGES_PARENT_PATH,
);

const { getSectionPagesModule } = createSectionPagesModuleService().v1;

describe(createSectionPagesModuleService, () => {
  describe('v1.getSectionPagesModule', () => {
    beforeEach(() => {
      vi.mocked(getSectionPages).mockResolvedValue(MOCK_PAGES);
    });

    it('combines the module document with the children of the hosting page', async () => {
      vi.mocked(getSectionPagesModuleDocument).mockResolvedValue(
        MOCK_MODULE_DOCUMENT,
      );

      const result = await getSectionPagesModule(
        MOCK_SECTION_PAGES_MODULE_ID,
        MOCK_SECTION_PAGES_PARENT_ID,
        MOCK_SECTION_PAGES_PARENT_PATH,
        MOCK_TENANT,
      );

      expect(result).toEqual({
        ok: true,
        data: { ...MOCK_MODULE_DOCUMENT, pages: MOCK_PAGES },
      });
      expect(getSectionPagesModuleDocument).toHaveBeenCalledWith(
        MOCK_SECTION_PAGES_MODULE_ID,
        MOCK_TENANT,
      );
      expect(getSectionPages).toHaveBeenCalledWith(
        MOCK_SECTION_PAGES_PARENT_ID,
        MOCK_SECTION_PAGES_PARENT_PATH,
        MOCK_TENANT,
      );
    });

    it('resolves ok:false with the error when the module document fails', async () => {
      const error = mockValidationError();
      vi.mocked(getSectionPagesModuleDocument).mockRejectedValue(error);

      const result = await getSectionPagesModule(
        MOCK_MISSING_ID,
        MOCK_SECTION_PAGES_PARENT_ID,
        MOCK_SECTION_PAGES_PARENT_PATH,
        MOCK_TENANT,
      );

      expect(result).toEqual({ ok: false, error });
    });
  });
});
