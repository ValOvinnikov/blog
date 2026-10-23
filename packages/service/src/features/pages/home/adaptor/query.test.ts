import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawHomePage } from '@blog/service/testing/pages/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { homePageQuery } from './query';

const EN_HOME_ID = 'en-home';
const NL_HOME_ID = 'nl-home';

describe('homePageQuery', () => {
  it.each([
    [
      'whose SEO openGraph has no image',
      makeRawHomePage({
        seo: {
          metaTitle: 'Home',
          metaDescription: null,
          openGraph: { ogTitle: null, ogDescription: null, ogImage: null },
        },
      }),
    ],
    ['with a headingBlock and no hero', makeRawHomePage({ hero: null })],
  ])('parses a home page %s', (_, raw) => {
    expect(() => homePageQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['authored SEO', { ...makeRawHomePage(), seo: null }],
    ['heading block', { ...makeRawHomePage(), headingBlock: null }],
  ])('rejects a home page with no %s', (_, raw) => {
    expect(() => homePageQuery.parse(raw)).toThrow();
  });

  it('parses null as no matching page_home document, rather than throwing', () => {
    expect(homePageQuery.parse(null)).toBeNull();
  });
});

describe('homePageQuery language scoping', () => {
  const { EN, NL, FR } = LOCALE_ISO_CODES;

  function home(id: string, heading: string, language?: string) {
    return {
      _id: id,
      _type: 'page_home',
      headingBlock: { heading },
      ...(language ? { language } : {}),
    };
  }

  function run(dataset: unknown[], locale: string): Promise<unknown> {
    return evaluateGroqExpression(homePageQuery.query, dataset, null, {
      locale,
      defaultLocale: EN,
    });
  }

  const dataset = [
    home(EN_HOME_ID, 'Welcome', EN),
    home(NL_HOME_ID, 'Welkom', NL),
  ];

  it.each([
    [EN, 'Welcome'],
    [NL, 'Welkom'],
  ])('resolves the %s Home for its own language', async (locale, heading) => {
    expect(await run(dataset, locale)).toMatchObject({
      headingBlock: { heading },
    });
  });

  it('resolves nothing for a language without a Home, rather than another language', async () => {
    expect(await run(dataset, FR)).toBeNull();
  });

  it('resolves a Home with no language for the default language only', async () => {
    const legacy = [home(EN_HOME_ID, 'Welcome')];

    expect(await run(legacy, EN)).toMatchObject({
      headingBlock: { heading: 'Welcome' },
    });
    expect(await run(legacy, NL)).toBeNull();
  });

  it('lists the language of every Home as its translations', async () => {
    expect(await run(dataset, NL)).toMatchObject({
      translations: [{ language: EN }, { language: NL }],
    });
  });
});

describe('homePageQuery template layout', () => {
  const { EN, NL } = LOCALE_ISO_CODES;
  const TEMPLATE_ID = 'template-home';
  const MODULE_ID = 'post-latest-1';

  function home(id: string, language: string, template?: string) {
    return {
      _id: id,
      _type: 'page_home',
      language,
      headingBlock: { heading: id },
      ...(template ? { template: { _type: 'reference', _ref: template } } : {}),
    };
  }

  const dataset = [
    home(EN_HOME_ID, EN, TEMPLATE_ID),
    home(NL_HOME_ID, NL, TEMPLATE_ID),
    {
      _id: TEMPLATE_ID,
      _type: 'template_home',
      hero: { _type: 'reference', _ref: 'hero-1' },
      modules: [{ _key: 'a', _type: 'reference', _ref: MODULE_ID }],
    },
    { _id: 'hero-1', _type: 'module_heroBlog' },
    { _id: MODULE_ID, _type: 'module_postLatest' },
  ];

  function run(data: unknown[], locale: string): Promise<unknown> {
    return evaluateGroqExpression(homePageQuery.query, data, null, {
      locale,
      defaultLocale: EN,
    });
  }

  it.each([
    [EN, EN_HOME_ID],
    [NL, NL_HOME_ID],
  ])(
    'resolves the %s Home with its id and its template hero and modules',
    async (locale, id) => {
      expect(await run(dataset, locale)).toMatchObject({
        _id: id,
        hero: { _id: 'hero-1', _type: 'module_heroBlog' },
        modules: [{ _id: MODULE_ID, _type: 'module_postLatest' }],
      });
    },
  );

  it('resolves no hero and no modules for a Home without a template', async () => {
    expect(await run([home(EN_HOME_ID, EN)], EN)).toMatchObject({
      hero: null,
      modules: null,
    });
  });
});
