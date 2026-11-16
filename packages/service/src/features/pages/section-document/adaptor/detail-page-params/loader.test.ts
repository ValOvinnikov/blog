import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import { mockSlugPageDocument } from '@shinefold/service/testing/pages/fixtures';
import {
  MOCK_PAGE_LEGAL_DOCUMENT_CACHE_TAG,
  MOCK_PAGE_PRIVACY_DOCUMENT_CACHE_TAG,
} from '@shinefold/service/testing/sanity/query/cache-tags';
import { evaluateGroqExpression } from '@shinefold/service/testing/shared/groq';
import { mockTenant } from '@shinefold/service/testing/tenant';

import { getSectionDocumentParams } from './loader';
import { sectionDocumentParamsQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(6515);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_EN_SLUG = faker.lorem.slug();
const MOCK_NL_SLUG = faker.lorem.slug();
const MOCK_FR_SLUG = faker.lorem.slug();
const MOCK_LEGAL_SLUG = faker.lorem.slug();

const tenant = mockTenant();

describe(getSectionDocumentParams, () => {
  it("lists one section's pages in the given locales", async () => {
    const dataset = [
      mockSlugPageDocument({
        _type: 'page_privacyDocument',
        slug: MOCK_EN_SLUG,
        language: EN,
      }),
      mockSlugPageDocument({
        _type: 'page_privacyDocument',
        slug: MOCK_NL_SLUG,
        language: NL,
      }),
      mockSlugPageDocument({
        _type: 'page_privacyDocument',
        slug: MOCK_FR_SLUG,
        language: FR,
      }),
      mockSlugPageDocument({
        _type: 'page_legalDocument',
        slug: MOCK_LEGAL_SLUG,
        language: EN,
      }),
    ];

    const rows = await evaluateGroqExpression(
      sectionDocumentParamsQuery.query,
      dataset,
      null,
      { type: 'page_privacyDocument', locales: [EN, NL] },
    );

    expect(rows).toEqual([
      { slug: MOCK_EN_SLUG, language: EN },
      { slug: MOCK_NL_SLUG, language: NL },
    ]);
  });

  it('queries the section for the tenant under both section tags', async () => {
    mockRun.mockResolvedValueOnce([]);

    await getSectionDocumentParams('page_legalDocument', tenant, [EN]);

    expect(mockRun).toHaveBeenCalledWith(sectionDocumentParamsQuery, {
      parameters: { type: 'page_legalDocument', locales: [EN] },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_PAGE_PRIVACY_DOCUMENT_CACHE_TAG,
          MOCK_PAGE_LEGAL_DOCUMENT_CACHE_TAG,
        ],
      },
    });
  });
});
