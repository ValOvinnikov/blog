import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { MOCK_PAGE_LANDING_CACHE_TAG } from '@blog/service/testing/sanity/query/cache-tags';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_ABOUT_NL_SLUG,
  MOCK_ABOUT_SLUG,
} from '@blog/service/testing/shared/translated-pages-dataset';
import { mockTenant } from '@blog/service/testing/tenant';

import { getPageSlugs } from './loader';
import { landingPageParamsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const { EN, NL, FR } = LOCALE_ISO_CODES;
const tenant = mockTenant();

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
    {
      _id: 'a',
      _type: 'page_landing',
      slug: { current: MOCK_ABOUT_SLUG },
      language: EN,
    },
    {
      _id: 'b',
      _type: 'page_landing',
      slug: { current: MOCK_ABOUT_NL_SLUG },
      language: NL,
    },
    {
      _id: 'c',
      _type: 'page_landing',
      slug: { current: 'a-propos' },
      language: FR,
    },
    { _id: 'd', _type: 'page_landing', slug: { current: 'legacy' } },
  ];

  function run(locales: string[]): Promise<unknown> {
    return evaluateGroqExpression(landingPageParamsQuery.query, dataset, null, {
      locales,
      defaultLocale: EN,
    });
  }

  it('filters without following a parent reference', () => {
    const [filter] = landingPageParamsQuery.query.split('{');

    expect(filter).not.toContain('->');
  });

  it('restricts to the live languages', async () => {
    expect(await run([NL, EN])).toEqual([
      { slug: MOCK_ABOUT_SLUG, language: EN },
      { slug: MOCK_ABOUT_NL_SLUG, language: NL },
    ]);
  });

  it('resolves a nested page to its full path and an orphan to no path', async () => {
    const nested = [
      {
        _id: 'modules',
        _type: 'page_landing',
        slug: { current: 'modules' },
        language: EN,
      },
      {
        _id: 'faq',
        _type: 'page_landing',
        slug: { current: 'faq' },
        language: EN,
        parent: mockReference('modules'),
      },
      {
        _id: 'orphan',
        _type: 'page_landing',
        slug: { current: 'orphan' },
        language: EN,
        parent: mockReference('deleted'),
      },
    ];

    expect(
      await evaluateGroqExpression(landingPageParamsQuery.query, nested, null, {
        locales: [EN],
      }),
    ).toEqual([
      { slug: 'modules', language: EN },
      { slug: 'modules/faq', language: EN },
      { slug: null, language: EN },
    ]);
  });
});
