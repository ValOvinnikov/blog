import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPageSlugs } from './loader';
import { landingPageParamsQuery } from './query';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const { EN, NL, FR } = LOCALE_ISO_CODES;
const tenant = makeTenant();

describe(getPageSlugs, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('returns the page_landing slug and language entries', async () => {
    mockRun.mockResolvedValue([
      { slug: 'about', language: EN },
      { slug: 'over-ons', language: NL },
    ]);

    const params = await getPageSlugs(tenant, [EN, NL]);

    expect(params).toEqual([
      { slug: 'about', language: EN },
      { slug: 'over-ons', language: NL },
    ]);
  });

  it('drops a page whose path did not resolve', async () => {
    mockRun.mockResolvedValue([
      { slug: 'about', language: EN },
      { slug: null, language: EN },
    ]);

    const params = await getPageSlugs(tenant, [EN]);

    expect(params).toEqual([{ slug: 'about', language: EN }]);
  });

  it('returns an empty array when no landing pages exist', async () => {
    const params = await getPageSlugs(tenant, [EN, NL]);

    expect(params).toEqual([]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    await getPageSlugs(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:page_landing'] }),
      }),
    );
  });

  it('passes the live languages to the query', async () => {
    await getPageSlugs(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { locales: [EN, NL] } }),
    );
  });
});

describe('landingPageParamsQuery', () => {
  const dataset = [
    {
      _id: 'a',
      _type: 'page_landing',
      slug: { current: 'about' },
      language: EN,
    },
    {
      _id: 'b',
      _type: 'page_landing',
      slug: { current: 'over-ons' },
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
      { slug: 'about', language: EN },
      { slug: 'over-ons', language: NL },
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
        parent: { _type: 'reference', _ref: 'modules' },
      },
      {
        _id: 'orphan',
        _type: 'page_landing',
        slug: { current: 'orphan' },
        language: EN,
        parent: { _type: 'reference', _ref: 'deleted' },
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
