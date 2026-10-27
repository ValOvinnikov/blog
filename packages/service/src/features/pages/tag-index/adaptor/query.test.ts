import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_TAG_INDEX_HEADING,
  MOCK_TEMPLATE_REFERENCE,
  mockIndexPageDocument,
  mockRawCtaRef,
  mockRawHeroRef,
  mockRawPostLatestRef,
  mockRawTagIndexPage,
  mockRawTaxonomyListRef,
  mockTemplateLayoutDocuments,
  mockTemplatedPageDocument,
} from '@blog/service/testing/pages/fixtures';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqInLocale } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { tagIndexPageQuery } from './query';

faker.seed(601508);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const MOCK_EN_HEADING = faker.lorem.words(2);
const MOCK_NL_HEADING = faker.lorem.words(2);

describe('tagIndexPageQuery', () => {
  it.each([
    [
      'with no hero or modules',
      mockRawTagIndexPage({ hero: null, modules: null }),
    ],
    [
      'with a taxonomy list module alongside other modules',
      mockRawTagIndexPage({
        modules: [mockRawTaxonomyListRef(), mockRawCtaRef()],
      }),
    ],
    ['with its hero slot set', mockRawTagIndexPage({ hero: mockRawHeroRef() })],
    [
      'with an authored headingBlock',
      mockRawTagIndexPage({
        headingBlock: mockRawHeadingBlock(MOCK_TAG_INDEX_HEADING),
      }),
    ],
  ])('parses a tag index page %s', (_, raw) => {
    expect(() => tagIndexPageQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['heading block', { ...mockRawTagIndexPage(), headingBlock: null }],
    ['authored SEO', { ...mockRawTagIndexPage(), seo: null }],
  ])('rejects a tag index page with no %s', (_, raw) => {
    expect(() => tagIndexPageQuery.parse(raw)).toThrow();
  });

  it('parses null as no matching page_tagIndex document', () => {
    expect(tagIndexPageQuery.parse(null)).toBeNull();
  });
});

describe('tagIndexPageQuery template layout', () => {
  const dataset = mockTemplateLayoutDocuments({ _type: 'template_tagIndex' });

  it('resolves the hero and modules of the template the tag index page references', async () => {
    const page = mockTemplatedPageDocument({
      _type: 'page_tagIndex',
      template: MOCK_TEMPLATE_REFERENCE,
    });

    const result = await evaluateGroqInLocale(tagIndexPageQuery.query, [
      page,
      ...dataset,
    ]);

    expect(result).toMatchObject({
      hero: mockRawHeroRef(),
      modules: [mockRawPostLatestRef()],
    });
  });

  it('resolves no hero and no modules for a tag index page without a template', async () => {
    const page = mockTemplatedPageDocument({ _type: 'page_tagIndex' });

    const result = await evaluateGroqInLocale(tagIndexPageQuery.query, [
      page,
      ...dataset,
    ]);

    expect(result).toMatchObject({ hero: null, modules: null });
  });
});

describe('tagIndexPageQuery language scoping', () => {
  const dataset = [
    mockIndexPageDocument({
      _type: 'page_tagIndex',
      heading: MOCK_EN_HEADING,
      language: EN,
    }),
    mockIndexPageDocument({
      _type: 'page_tagIndex',
      heading: MOCK_NL_HEADING,
      language: NL,
    }),
  ];

  it.each([
    [EN, MOCK_EN_HEADING],
    [NL, MOCK_NL_HEADING],
  ])(
    'resolves the %s tag index page for its own language',
    async (locale, heading) => {
      const result = await evaluateGroqInLocale(
        tagIndexPageQuery.query,
        dataset,
        locale,
      );

      expect(result).toMatchObject({ headingBlock: { heading } });
    },
  );

  it('resolves nothing for a language without a tag index page', async () => {
    const result = await evaluateGroqInLocale(
      tagIndexPageQuery.query,
      dataset,
      FR,
    );

    expect(result).toBeNull();
  });

  describe('a tag index page with no language', () => {
    const legacy = [
      mockIndexPageDocument({
        _type: 'page_tagIndex',
        heading: MOCK_EN_HEADING,
      }),
    ];

    it('resolves for the default language', async () => {
      const result = await evaluateGroqInLocale(
        tagIndexPageQuery.query,
        legacy,
        EN,
      );

      expect(result).toMatchObject({
        headingBlock: { heading: MOCK_EN_HEADING },
      });
    });

    it('resolves nothing for any other language', async () => {
      const result = await evaluateGroqInLocale(
        tagIndexPageQuery.query,
        legacy,
        NL,
      );

      expect(result).toBeNull();
    });
  });

  it('lists the language of every tag index page as its translations', async () => {
    const result = await evaluateGroqInLocale(
      tagIndexPageQuery.query,
      dataset,
      NL,
    );

    expect(result).toMatchObject({
      translations: [{ language: EN }, { language: NL }],
    });
  });
});
