import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { MOCK_PAGE_LANDING_CACHE_TAG } from '@blog/service/testing/sanity/query/cache-tags';
import { mockReference, mockSlug } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_ABOUT_NL_SLUG,
  MOCK_ABOUT_SLUG,
  mockLandingPageDocument,
} from '@blog/service/testing/shared/translated-pages-dataset';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getPageSlugs } from './loader';
import { landingPageParamsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6015106);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const tenant = mockTenant();
const MOCK_FR_SLUG = mockSlug();
const MOCK_LEGACY_SLUG = mockSlug();
const MOCK_SECTION_SLUG = mockSlug();
const MOCK_CHILD_SLUG = mockSlug();
const MOCK_ORPHAN_SLUG = mockSlug();

describe(getPageSlugs, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('returns the page_landing slug and language entries', async () => {
    mockRun.mockResolvedValueOnce([
      { slug: MOCK_ABOUT_SLUG, language: EN },
      { slug: MOCK_ABOUT_NL_SLUG, language: NL },
    ]);

    const params = await getPageSlugs(tenant, [EN, NL]);

    expect(params).toEqual([
      { slug: MOCK_ABOUT_SLUG, language: EN },
      { slug: MOCK_ABOUT_NL_SLUG, language: NL },
    ]);
  });

  it('drops a page whose path did not resolve', async () => {
    mockRun.mockResolvedValueOnce([
      { slug: MOCK_ABOUT_SLUG, language: EN },
      { slug: null, language: EN },
    ]);

    const params = await getPageSlugs(tenant, [EN]);

    expect(params).toEqual([{ slug: MOCK_ABOUT_SLUG, language: EN }]);
  });

  it('returns an empty array when no landing pages exist', async () => {
    const params = await getPageSlugs(tenant, [EN, NL]);

    expect(params).toEqual([]);
  });

  it('queries the live languages for the tenant and scopes the tags to it', async () => {
    await getPageSlugs(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(landingPageParamsQuery, {
      parameters: { locales: [EN, NL] },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_PAGE_LANDING_CACHE_TAG],
      },
    });
  });
});

describe('landingPageParamsQuery', () => {
  const dataset = [
    mockLandingPageDocument(faker.string.uuid(), EN, MOCK_ABOUT_SLUG),
    mockLandingPageDocument(faker.string.uuid(), NL, MOCK_ABOUT_NL_SLUG),
    mockLandingPageDocument(faker.string.uuid(), FR, MOCK_FR_SLUG),
    {
      _id: faker.string.uuid(),
      _type: 'page_landing',
      slug: { current: MOCK_LEGACY_SLUG },
    },
  ];

  function run(locales: string[]): Promise<unknown> {
    return evaluateGroqExpression(landingPageParamsQuery.query, dataset, null, {
      locales,
      defaultLocale: EN,
    });
  }

  it('restricts to the live languages', async () => {
    expect(await run([NL, EN])).toEqual([
      { slug: MOCK_ABOUT_SLUG, language: EN },
      { slug: MOCK_ABOUT_NL_SLUG, language: NL },
    ]);
  });

  it('resolves a nested page to its full path and an orphan to no path', async () => {
    const sectionId = faker.string.uuid();
    const nested = [
      mockLandingPageDocument(sectionId, EN, MOCK_SECTION_SLUG),
      {
        ...mockLandingPageDocument(faker.string.uuid(), EN, MOCK_CHILD_SLUG),
        parent: mockReference(sectionId),
      },
      {
        ...mockLandingPageDocument(faker.string.uuid(), EN, MOCK_ORPHAN_SLUG),
        parent: mockReference(faker.string.uuid()),
      },
    ];

    expect(
      await evaluateGroqExpression(landingPageParamsQuery.query, nested, null, {
        locales: [EN],
      }),
    ).toEqual([
      { slug: MOCK_SECTION_SLUG, language: EN },
      { slug: `${MOCK_SECTION_SLUG}/${MOCK_CHILD_SLUG}`, language: EN },
      { slug: null, language: EN },
    ]);
  });
});
