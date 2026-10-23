import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { getFaqQuestions } from '@blog/service/shared/adaptors/faq-questions/loader';
import { MOCK_TAG_SLUG } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  mockFaqView,
  mockRawFaqModuleQuestions,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_HERO_MODULE_ID,
  mockListModulePageSize,
  mockListModuleRefs,
  mockRawTagPage,
} from '@blog/service/testing/pages/fixtures';
import { MOCK_MISSING_ID } from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { createTagService } from './service';

vi.mock('@blog/service/sanity/query/query');

vi.mock('@blog/service/shared/adaptors/faq-questions/loader');

const mockFaqQuestions = vi.mocked(getFaqQuestions);
const { EN, NL } = LOCALE_ISO_CODES;
const tenant = mockTenant();

describe(createTagService, () => {
  describe('v1.getTagPage', () => {
    it("adds the faqs of the page's FAQ modules to the page", async () => {
      mockRun.mockResolvedValueOnce(
        mockRawTagPage({ modules: [{ _id: 'faq-a', _type: 'module_faq' }] }),
      );
      mockFaqQuestions.mockResolvedValueOnce([mockRawFaqModuleQuestions()]);

      const result = await createTagService().v1.getTagPage(
        MOCK_TAG_SLUG,
        tenant,
      );
      if (!result.ok || !result.data) throw new Error('expected a page');

      expect(mockFaqQuestions).toHaveBeenCalledExactlyOnceWith(
        ['faq-a'],
        tenant,
      );
      expect(result.data.faqs).toEqual([mockFaqView()]);
    });

    it('resolves undefined data without a FAQ request when no page matches the slug', async () => {
      mockRun.mockResolvedValueOnce(null);

      const result = await createTagService().v1.getTagPage(
        MOCK_MISSING_ID,
        tenant,
      );

      expect(result).toEqual({ ok: true, data: undefined });
      expect(mockFaqQuestions).not.toHaveBeenCalled();
    });
  });

  describe('v1.getTagPaginationParams', () => {
    it('pages each page by the page size of its first post list module', async () => {
      mockRun
        .mockResolvedValueOnce([
          {
            slug: MOCK_TAG_SLUG,
            language: EN,
            moduleRefs: mockListModuleRefs(),
            postCount: 20,
          },
          {
            slug: 'react',
            language: EN,
            moduleRefs: mockListModuleRefs(),
            postCount: 9,
          },
          {
            slug: 'no-list',
            language: EN,
            moduleRefs: [{ _ref: MOCK_HERO_MODULE_ID }],
            postCount: 50,
          },
        ])
        .mockResolvedValueOnce([mockListModulePageSize()]);

      const result = await createTagService().v1.getTagPaginationParams(
        tenant,
        [EN, NL],
      );

      expect(result).toEqual({
        ok: true,
        data: [
          { slug: MOCK_TAG_SLUG, language: EN, page: '2' },
          { slug: MOCK_TAG_SLUG, language: EN, page: '3' },
        ],
      });
    });
  });
});
