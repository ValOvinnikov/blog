import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { MOCK_TAG_SLUG } from '@shinefold/service/testing/entities/fixtures';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import { mockSlugPageDocument } from '@shinefold/service/testing/pages/fixtures';
import { MOCK_PAGE_TAG_CACHE_TAG } from '@shinefold/service/testing/sanity/query/cache-tags';
import { evaluateGroqExpression } from '@shinefold/service/testing/shared/groq';
import { mockTenant } from '@shinefold/service/testing/tenant';

import { getTagParams } from './loader';
import { tagParamsQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(601504);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const MOCK_NL_SLUG = faker.lorem.slug();
const MOCK_FR_SLUG = faker.lorem.slug();
const MOCK_ENTRIES = [
  { slug: MOCK_TAG_SLUG, language: EN },
  { slug: MOCK_NL_SLUG, language: NL },
];
const tenant = mockTenant();

describe(getTagParams, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('returns the slug and language entries', async () => {
    mockRun.mockResolvedValueOnce(MOCK_ENTRIES);

    const params = await getTagParams(tenant, [EN, NL]);

    expect(params).toEqual(MOCK_ENTRIES);
  });

  it('returns an empty array when there are no tag pages', async () => {
    const params = await getTagParams(tenant, [EN]);

    expect(params).toEqual([]);
  });

  it('queries the live languages for the tenant and scopes the tags to it', async () => {
    await getTagParams(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(tagParamsQuery, {
      parameters: { locales: [EN, NL] },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_PAGE_TAG_CACHE_TAG],
      },
    });
  });
});

describe('tagParamsQuery', () => {
  it('restricts to the live languages', async () => {
    const dataset = [
      mockSlugPageDocument({
        _type: 'page_tag',
        slug: MOCK_TAG_SLUG,
        language: EN,
      }),
      mockSlugPageDocument({
        _type: 'page_tag',
        slug: MOCK_NL_SLUG,
        language: NL,
      }),
      mockSlugPageDocument({
        _type: 'page_tag',
        slug: MOCK_FR_SLUG,
        language: FR,
      }),
    ];

    const result = await evaluateGroqExpression(
      tagParamsQuery.query,
      dataset,
      null,
      { locales: [EN, NL] },
    );

    expect(result).toEqual(MOCK_ENTRIES);
  });
});
