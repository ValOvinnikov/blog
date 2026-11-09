import { getFaqQuestions } from '@blog/service/shared/adaptors/faq-questions/loader';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  mockFaqView,
  mockRawFaqModuleQuestions,
} from '@blog/service/testing/modules/fixtures';
import { mockRawSectionIndexPage } from '@blog/service/testing/pages/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { createSectionIndexService } from './service';

vi.mock('@blog/service/sanity/query/query');

vi.mock('@blog/service/shared/adaptors/faq-questions/loader');

const mockFaqQuestions = vi.mocked(getFaqQuestions);
faker.seed(65153);

const tenant = mockTenant();
const MOCK_FAQ_MODULE_ID = faker.string.uuid();

describe(createSectionIndexService, () => {
  describe('v1.getSectionIndexPage', () => {
    it("adds the faqs of the hub's FAQ modules to the hub", async () => {
      mockRun.mockResolvedValueOnce(
        mockRawSectionIndexPage({
          modules: [{ _id: MOCK_FAQ_MODULE_ID, _type: 'module_faq' }],
        }),
      );
      mockFaqQuestions.mockResolvedValueOnce([mockRawFaqModuleQuestions()]);

      const result = await createSectionIndexService().v1.getSectionIndexPage(
        'page_legalIndex',
        tenant,
      );
      if (!result.ok || !result.data) throw new Error('expected a hub');

      expect(mockFaqQuestions).toHaveBeenCalledExactlyOnceWith(
        [MOCK_FAQ_MODULE_ID],
        tenant,
      );
      expect(result.data.faqs).toEqual([mockFaqView()]);
    });

    it('resolves undefined data without a FAQ request when the hub does not exist', async () => {
      mockRun.mockResolvedValueOnce(null);

      const result = await createSectionIndexService().v1.getSectionIndexPage(
        'page_privacyIndex',
        tenant,
      );

      expect(result).toEqual({ ok: true, data: undefined });
      expect(mockFaqQuestions).not.toHaveBeenCalled();
    });
  });
});
