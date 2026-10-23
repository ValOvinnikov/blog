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

import { tagIndexPageQuery } from './query';

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
    [
      'with its hero slot set',
      mockRawTagIndexPage({
        hero: mockRawHeroRef(),
      }),
    ],
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

  it('parses null as no matching page_tagIndex document, rather than throwing', () => {
    expect(tagIndexPageQuery.parse(null)).toBeNull();
  });
});

describe('tagIndexPageQuery template layout', () => {
  const templateRef = MOCK_TEMPLATE_REFERENCE;
  const dataset = mockTemplateLayoutDocuments({ _type: 'template_tagIndex' });

  it('resolves the hero and modules of the template the tag index page references', async () => {
    expect(
      await evaluateGroqInLocale(tagIndexPageQuery.query, [
        mockTemplatedPageDocument({
          _type: 'page_tagIndex',
          template: templateRef,
        }),
        ...dataset,
      ]),
    ).toMatchObject({
      hero: mockRawHeroRef(),
      modules: [mockRawPostLatestRef()],
    });
  });

  it('resolves no hero and no modules for a tag index page without a template', async () => {
    expect(
      await evaluateGroqInLocale(tagIndexPageQuery.query, [
        mockTemplatedPageDocument({ _type: 'page_tagIndex' }),
        ...dataset,
      ]),
    ).toMatchObject({
      hero: null,
      modules: null,
    });
  });
});

describe('tagIndexPageQuery language scoping', () => {
  const { EN, NL, FR } = LOCALE_ISO_CODES;
  const EN_HEADING = 'Tags';
  const NL_HEADING = 'Labels';

  const dataset = [
    mockIndexPageDocument({
      _type: 'page_tagIndex',
      heading: EN_HEADING,
      language: EN,
    }),
    mockIndexPageDocument({
      _type: 'page_tagIndex',
      heading: NL_HEADING,
      language: NL,
    }),
  ];

  it.each([
    [EN, EN_HEADING],
    [NL, NL_HEADING],
  ])(
    'resolves the %s tag index page for its own language',
    async (locale, heading) => {
      expect(
        await evaluateGroqInLocale(tagIndexPageQuery.query, dataset, locale),
      ).toMatchObject({
        headingBlock: { heading },
      });
    },
  );

  it('resolves nothing for a language without a tag index page', async () => {
    expect(
      await evaluateGroqInLocale(tagIndexPageQuery.query, dataset, FR),
    ).toBeNull();
  });

  it('resolves a tag index page with no language for the default language only', async () => {
    const legacy = [
      mockIndexPageDocument({ _type: 'page_tagIndex', heading: EN_HEADING }),
    ];

    expect(
      await evaluateGroqInLocale(tagIndexPageQuery.query, legacy, EN),
    ).toMatchObject({
      headingBlock: { heading: EN_HEADING },
    });
    expect(
      await evaluateGroqInLocale(tagIndexPageQuery.query, legacy, NL),
    ).toBeNull();
  });

  it('lists the language of every tag index page as its translations', async () => {
    expect(
      await evaluateGroqInLocale(tagIndexPageQuery.query, dataset, NL),
    ).toMatchObject({
      translations: [{ language: EN }, { language: NL }],
    });
  });
});
