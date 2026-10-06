import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { getFaqQuestions } from '@blog/service/shared/adaptors/faq-questions/loader';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawFaqModuleQuestions } from '@blog/service/testing/modules/fixtures';
import { makeRawTopicPage } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { createTopicService } from './service';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

vi.mock('@blog/service/shared/adaptors/faq-questions/loader');

const mockFaqQuestions = vi.mocked(getFaqQuestions);
const { EN, NL } = LOCALE_ISO_CODES;
const tenant = makeTenant();

describe('createTopicService', () => {
  describe('v1.getTopicPage', () => {
    it("adds the faqs of the page's FAQ modules to the page", async () => {
      mockRun.mockResolvedValueOnce(
        makeRawTopicPage({ modules: [{ _id: 'faq-a', _type: 'module_faq' }] }),
      );
      mockFaqQuestions.mockResolvedValueOnce([makeRawFaqModuleQuestions()]);

      const result = await createTopicService().v1.getTopicPage(
        'engineering',
        tenant,
      );
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

    it('resolves undefined data without a FAQ request when no page matches the slug', async () => {
      mockRun.mockResolvedValueOnce(null);

      const result = await createTopicService().v1.getTopicPage(
        'missing',
        tenant,
      );

      expect(result).toEqual({ ok: true, data: undefined });
      expect(mockFaqQuestions).not.toHaveBeenCalled();
    });
  });

  describe('v1.getTopicPaginationParams', () => {
    it('pages each page by the page size of its first post list module', async () => {
      mockRun
        .mockResolvedValueOnce([
          {
            slug: 'engineering',
            language: EN,
            moduleRefs: [{ _ref: 'list-1' }],
            postCount: 20,
          },
          {
            slug: 'design',
            language: EN,
            moduleRefs: [{ _ref: 'list-1' }],
            postCount: 9,
          },
          {
            slug: 'no-list',
            language: EN,
            moduleRefs: [{ _ref: 'hero-1' }],
            postCount: 50,
          },
        ])
        .mockResolvedValueOnce([{ _id: 'list-1', pageSize: 9 }]);

      const result = await createTopicService().v1.getTopicPaginationParams(
        tenant,
        [EN, NL],
      );

      expect(result).toEqual({
        ok: true,
        data: [
          { slug: 'engineering', language: EN, page: '2' },
          { slug: 'engineering', language: EN, page: '3' },
        ],
      });
    });

    it('fetches the page sizes of all pages in one request', async () => {
      mockRun
        .mockResolvedValueOnce([
          {
            slug: 'engineering',
            language: EN,
            moduleRefs: [{ _ref: 'list-1' }],
            postCount: 20,
          },
          {
            slug: 'design',
            language: EN,
            moduleRefs: [{ _ref: 'list-2' }],
            postCount: 20,
          },
        ])
        .mockResolvedValueOnce([]);

      await createTopicService().v1.getTopicPaginationParams(tenant, [EN, NL]);

      expect(mockRun).toHaveBeenCalledTimes(2);
      expect(mockRun).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ parameters: { ids: ['list-1', 'list-2'] } }),
      );
    });
  });
});
