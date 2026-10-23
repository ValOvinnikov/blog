import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_TEMPLATE_REFERENCE,
  MOCK_TOPIC_INDEX_HEADING,
  mockIndexPageDocument,
  mockRawCtaRef,
  mockRawHeroRef,
  mockRawPostLatestRef,
  mockRawTaxonomyListRef,
  mockRawTopicIndexPage,
  mockTemplateLayoutDocuments,
  mockTemplatedPageDocument,
} from '@blog/service/testing/pages/fixtures';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqInLocale } from '@blog/service/testing/shared/groq';

import { topicIndexPageQuery } from './query';

describe('topicIndexPageQuery', () => {
  it.each([
    [
      'with no hero or modules',
      mockRawTopicIndexPage({ hero: null, modules: null }),
    ],
    [
      'with a taxonomy list module alongside other modules',
      mockRawTopicIndexPage({
        modules: [mockRawTaxonomyListRef(), mockRawCtaRef()],
      }),
    ],
    [
      'with its hero slot set',
      mockRawTopicIndexPage({
        hero: mockRawHeroRef(),
      }),
    ],
    [
      'with an authored headingBlock',
      mockRawTopicIndexPage({
        headingBlock: mockRawHeadingBlock(MOCK_TOPIC_INDEX_HEADING),
      }),
    ],
  ])('parses a topic index page %s', (_, raw) => {
    expect(() => topicIndexPageQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['heading block', { ...mockRawTopicIndexPage(), headingBlock: null }],
    ['authored SEO', { ...mockRawTopicIndexPage(), seo: null }],
  ])('rejects a topic index page with no %s', (_, raw) => {
    expect(() => topicIndexPageQuery.parse(raw)).toThrow();
  });

  it('parses null as no matching page_topicIndex document, rather than throwing', () => {
    expect(topicIndexPageQuery.parse(null)).toBeNull();
  });
});

describe('topicIndexPageQuery template layout', () => {
  const templateRef = MOCK_TEMPLATE_REFERENCE;
  const dataset = mockTemplateLayoutDocuments({ _type: 'template_topicIndex' });

  it('resolves the hero and modules of the template the topic index page references', async () => {
    expect(
      await evaluateGroqInLocale(topicIndexPageQuery.query, [
        mockTemplatedPageDocument({
          _type: 'page_topicIndex',
          template: templateRef,
        }),
        ...dataset,
      ]),
    ).toMatchObject({
      hero: mockRawHeroRef(),
      modules: [mockRawPostLatestRef()],
    });
  });

  it('resolves no hero and no modules for a topic index page without a template', async () => {
    expect(
      await evaluateGroqInLocale(topicIndexPageQuery.query, [
        mockTemplatedPageDocument({ _type: 'page_topicIndex' }),
        ...dataset,
      ]),
    ).toMatchObject({
      hero: null,
      modules: null,
    });
  });
});

describe('topicIndexPageQuery language scoping', () => {
  const { EN, NL, FR } = LOCALE_ISO_CODES;
  const EN_HEADING = 'Topics';
  const NL_HEADING = 'Onderwerpen';

  const dataset = [
    mockIndexPageDocument({
      _type: 'page_topicIndex',
      heading: EN_HEADING,
      language: EN,
    }),
    mockIndexPageDocument({
      _type: 'page_topicIndex',
      heading: NL_HEADING,
      language: NL,
    }),
  ];

  it.each([
    [EN, EN_HEADING],
    [NL, NL_HEADING],
  ])(
    'resolves the %s topic index page for its own language',
    async (locale, heading) => {
      expect(
        await evaluateGroqInLocale(topicIndexPageQuery.query, dataset, locale),
      ).toMatchObject({
        headingBlock: { heading },
      });
    },
  );

  it('resolves nothing for a language without a topic index page', async () => {
    expect(
      await evaluateGroqInLocale(topicIndexPageQuery.query, dataset, FR),
    ).toBeNull();
  });

  it('resolves a topic index page with no language for the default language only', async () => {
    const legacy = [
      mockIndexPageDocument({ _type: 'page_topicIndex', heading: EN_HEADING }),
    ];

    expect(
      await evaluateGroqInLocale(topicIndexPageQuery.query, legacy, EN),
    ).toMatchObject({
      headingBlock: { heading: EN_HEADING },
    });
    expect(
      await evaluateGroqInLocale(topicIndexPageQuery.query, legacy, NL),
    ).toBeNull();
  });

  it('lists the language of every topic index page as its translations', async () => {
    expect(
      await evaluateGroqInLocale(topicIndexPageQuery.query, dataset, NL),
    ).toMatchObject({
      translations: [{ language: EN }, { language: NL }],
    });
  });
});
