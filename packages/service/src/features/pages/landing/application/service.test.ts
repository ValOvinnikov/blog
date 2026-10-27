import { getFaqQuestions } from '@blog/service/shared/adaptors/faq-questions/loader';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  mockFaqView,
  mockRawFaqModuleQuestions,
} from '@blog/service/testing/modules/fixtures';
import { mockRawLandingPage } from '@blog/service/testing/pages/fixtures';
import { MOCK_ABOUT_SLUG } from '@blog/service/testing/shared/translated-pages-dataset';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { createLandingPageService } from './service';

vi.mock('@blog/service/sanity/query/query');

vi.mock('@blog/service/shared/adaptors/faq-questions/loader');

faker.seed(6015104);

const mockFaqQuestions = vi.mocked(getFaqQuestions);
const tenant = mockTenant();
const MOCK_FAQ_MODULE_ID = faker.string.uuid();

describe(createLandingPageService, () => {
  describe('v1.getPage', () => {
    it("adds the faqs of the page's FAQ modules to the page", async () => {
      mockRun.mockResolvedValueOnce(
        mockRawLandingPage({
          modules: [{ _id: MOCK_FAQ_MODULE_ID, _type: 'module_faq' }],
        }),
      );
      mockFaqQuestions.mockResolvedValueOnce([mockRawFaqModuleQuestions()]);

      const result = await createLandingPageService().v1.getPage(
        [MOCK_ABOUT_SLUG],
        tenant,
      );
      if (!result.ok || !result.data) throw new Error('expected a page');

      expect(mockFaqQuestions).toHaveBeenCalledExactlyOnceWith(
        [MOCK_FAQ_MODULE_ID],
        tenant,
      );
      expect(result.data.faqs).toEqual([mockFaqView()]);
    });

    it('resolves undefined data without a FAQ request when there is no page', async () => {
      mockRun.mockResolvedValueOnce(null);

      const result = await createLandingPageService().v1.getPage(
        [MOCK_ABOUT_SLUG],
        tenant,
      );

      expect(result).toEqual({ ok: true, data: undefined });
      expect(mockFaqQuestions).not.toHaveBeenCalled();
    });
  });
});
