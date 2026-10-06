import { getFaqQuestions } from '@blog/service/shared/adaptors/faq-questions/loader';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawFaqModuleQuestions } from '@blog/service/testing/modules/fixtures';
import { makeRawHomePage } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { createHomeService } from './service';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

vi.mock('@blog/service/shared/adaptors/faq-questions/loader');

const mockFaqQuestions = vi.mocked(getFaqQuestions);
const tenant = makeTenant();

describe('createHomeService', () => {
  describe('v1.getHomePage', () => {
    it("adds the faqs of the page's FAQ modules to the page", async () => {
      mockRun.mockResolvedValueOnce(
        makeRawHomePage({ modules: [{ _id: 'faq-a', _type: 'module_faq' }] }),
      );
      mockFaqQuestions.mockResolvedValueOnce([makeRawFaqModuleQuestions()]);

      const result = await createHomeService().v1.getHomePage(tenant);
      if (!result.ok || !result.data) throw new Error('expected a page');

      expect(mockFaqQuestions).toHaveBeenCalledExactlyOnceWith(
        ['faq-a'],
        tenant,
      );
      expect(result.data.faqs).toEqual([
        {
          id: 'block-faq-1',
          question: 'How long does onboarding take?',
          answer: 'Most teams are live within a week.',
        },
      ]);
    });

    it('resolves undefined data without a FAQ request when there is no page', async () => {
      mockRun.mockResolvedValueOnce(null);

      const result = await createHomeService().v1.getHomePage(tenant);

      expect(result).toEqual({ ok: true, data: undefined });
      expect(mockFaqQuestions).not.toHaveBeenCalled();
    });
  });
});
