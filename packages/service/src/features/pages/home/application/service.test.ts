import { faker } from '@faker-js/faker';
import { getFaqQuestions } from '@shinefold/service/shared/adaptors/faq-questions/loader';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import {
  mockFaqView,
  mockRawFaqModuleQuestions,
} from '@shinefold/service/testing/modules/fixtures';
import { mockRawHomePage } from '@shinefold/service/testing/pages/fixtures';
import { mockTenant } from '@shinefold/service/testing/tenant';

import { createHomeService } from './service';

vi.mock('@shinefold/service/sanity/query/query');

vi.mock('@shinefold/service/shared/adaptors/faq-questions/loader');

const mockFaqQuestions = vi.mocked(getFaqQuestions);
faker.seed(6015103);

const tenant = mockTenant();
const MOCK_FAQ_MODULE_ID = faker.string.uuid();

describe(createHomeService, () => {
  describe('v1.getHomePage', () => {
    it("adds the faqs of the page's FAQ modules to the page", async () => {
      mockRun.mockResolvedValueOnce(
        mockRawHomePage({
          modules: [{ _id: MOCK_FAQ_MODULE_ID, _type: 'module_faq' }],
        }),
      );
      mockFaqQuestions.mockResolvedValueOnce([mockRawFaqModuleQuestions()]);

      const result = await createHomeService().v1.getHomePage(tenant);
      if (!result.ok || !result.data) throw new Error('expected a page');

      expect(mockFaqQuestions).toHaveBeenCalledExactlyOnceWith(
        [MOCK_FAQ_MODULE_ID],
        tenant,
      );
      expect(result.data.faqs).toEqual([mockFaqView()]);
    });

    it('resolves undefined data without a FAQ request when there is no page', async () => {
      mockRun.mockResolvedValueOnce(null);

      const result = await createHomeService().v1.getHomePage(tenant);

      expect(result).toEqual({ ok: true, data: undefined });
      expect(mockFaqQuestions).not.toHaveBeenCalled();
    });
  });
});
