import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_HERO_MODULE_ID,
  MOCK_POST_LATEST_MODULE_ID,
  mockRawHomePage,
} from '@blog/service/testing/pages/fixtures';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { homePageQuery } from './query';

faker.seed(6015102);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const MOCK_EN_HOME_ID = faker.string.uuid();
const MOCK_NL_HOME_ID = faker.string.uuid();
const MOCK_EN_HEADING = faker.lorem.words(2);
const MOCK_NL_HEADING = faker.lorem.words(3);
const MOCK_TEMPLATE_ID = faker.string.uuid();
const MOCK_META_TITLE = faker.lorem.words(2);

function run(dataset: unknown[], locale: string): Promise<unknown> {
  return evaluateGroqExpression(homePageQuery.query, dataset, null, {
    locale,
    defaultLocale: EN,
  });
}

const HEADING_TEXT_PATH = 'headingBlock.heading';

describe('homePageQuery', () => {
  it.each([
    [
      'whose SEO openGraph has no image',
      mockRawHomePage({
        seo: {
          metaTitle: MOCK_META_TITLE,
          metaDescription: null,
          openGraph: { ogTitle: null, ogDescription: null, ogImage: null },
        },
      }),
    ],
    ['with a headingBlock and no hero', mockRawHomePage({ hero: null })],
  ])('parses a home page %s', (_, raw) => {
    expect(() => homePageQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['authored SEO', { ...mockRawHomePage(), seo: null }],
    ['heading block', { ...mockRawHomePage(), headingBlock: null }],
  ])('rejects a home page with no %s', (_, raw) => {
    expect(() => homePageQuery.parse(raw)).toThrow();
  });

  it('parses null as no matching page_home document', () => {
    expect(homePageQuery.parse(null)).toBeNull();
  });
});

describe('homePageQuery language scoping', () => {
  function mockHomeDocument(id: string, heading: string, language?: string) {
    return {
      _id: id,
      _type: 'page_home',
      headingBlock: { heading },
      ...(language ? { language } : {}),
    };
  }

  const dataset = [
    mockHomeDocument(MOCK_EN_HOME_ID, MOCK_EN_HEADING, EN),
    mockHomeDocument(MOCK_NL_HOME_ID, MOCK_NL_HEADING, NL),
  ];

  it.each([
    [EN, MOCK_EN_HEADING],
    [NL, MOCK_NL_HEADING],
  ])('resolves the %s Home for its own language', async (locale, heading) => {
    expect(await run(dataset, locale)).toHaveProperty(
      HEADING_TEXT_PATH,
      heading,
    );
  });

  it('resolves nothing for a language without a Home', async () => {
    expect(await run(dataset, FR)).toBeNull();
  });

  it('resolves a Home with no language for the default language only', async () => {
    const legacy = [mockHomeDocument(MOCK_EN_HOME_ID, MOCK_EN_HEADING)];

    expect(await run(legacy, EN)).toHaveProperty(
      HEADING_TEXT_PATH,
      MOCK_EN_HEADING,
    );
    expect(await run(legacy, NL)).toBeNull();
  });

  it('lists the language of every Home as its translations', async () => {
    expect(await run(dataset, NL)).toHaveProperty('translations', [
      { language: EN },
      { language: NL },
    ]);
  });
});

describe('homePageQuery template layout', () => {
  function mockHomeDocument(id: string, language: string, template?: string) {
    return {
      _id: id,
      _type: 'page_home',
      language,
      headingBlock: { heading: id },
      ...(template ? { template: mockReference(template) } : {}),
    };
  }

  const dataset = [
    mockHomeDocument(MOCK_EN_HOME_ID, EN, MOCK_TEMPLATE_ID),
    mockHomeDocument(MOCK_NL_HOME_ID, NL, MOCK_TEMPLATE_ID),
    {
      _id: MOCK_TEMPLATE_ID,
      _type: 'template_home',
      hero: mockReference(MOCK_HERO_MODULE_ID),
      modules: [mockReference(MOCK_POST_LATEST_MODULE_ID, { _key: 'a' })],
    },
    { _id: MOCK_HERO_MODULE_ID, _type: 'module_heroBlog' },
    { _id: MOCK_POST_LATEST_MODULE_ID, _type: 'module_postLatest' },
  ];

  it.each([
    [EN, MOCK_EN_HOME_ID],
    [NL, MOCK_NL_HOME_ID],
  ])(
    'resolves the %s Home with its id and its template hero and modules',
    async (locale, id) => {
      const result = await run(dataset, locale);

      expect(result).toHaveProperty('_id', id);
      expect(result).toHaveProperty('hero', {
        _id: MOCK_HERO_MODULE_ID,
        _type: 'module_heroBlog',
      });
      expect(result).toHaveProperty('modules', [
        { _id: MOCK_POST_LATEST_MODULE_ID, _type: 'module_postLatest' },
      ]);
    },
  );

  it('resolves no hero and no modules for a Home without a template', async () => {
    const dataset = [mockHomeDocument(MOCK_EN_HOME_ID, EN)];

    const result = await run(dataset, EN);

    expect(result).toHaveProperty('hero', null);
    expect(result).toHaveProperty('modules', null);
  });
});
