import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  HEADING_TEXT_PATH,
  MOCK_TEMPLATE_REFERENCE,
  MOCK_TOPIC_INDEX_HEADING,
  mockIndexPageDocument,
  mockRawCtaRef,
  mockRawHeroRef,
  mockRawPostLatestRef,
  mockRawTaxonomyListRef,
  mockRawTopicIndexPage,
  mockTemplatedPageDocument,
  mockTemplateLayoutDocuments,
} from '@blog/service/testing/pages/fixtures';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqInLocale } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { topicIndexPageQuery } from './query';

faker.seed(601608);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const MOCK_EN_HEADING = faker.lorem.words(2);
const MOCK_NL_HEADING = faker.lorem.words(2);

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
      mockRawTopicIndexPage({ hero: mockRawHeroRef() }),
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

  it('parses null as no matching page_topicIndex document', () => {
    expect(topicIndexPageQuery.parse(null)).toBeNull();
  });

  describe('template layout', () => {
    const dataset = mockTemplateLayoutDocuments({
      _type: 'template_topicIndex',
    });

    it('resolves the hero and modules of the template the topic index page references', async () => {
      const page = mockTemplatedPageDocument({
        _type: 'page_topicIndex',
        template: MOCK_TEMPLATE_REFERENCE,
      });

      const result = await evaluateGroqInLocale(topicIndexPageQuery.query, [
        page,
        ...dataset,
      ]);

      expect(result).toHaveProperty('hero', mockRawHeroRef());
      expect(result).toHaveProperty('modules', [mockRawPostLatestRef()]);
    });

    it('resolves no hero and no modules for a topic index page without a template', async () => {
      const page = mockTemplatedPageDocument({ _type: 'page_topicIndex' });

      const result = await evaluateGroqInLocale(topicIndexPageQuery.query, [
        page,
        ...dataset,
      ]);

      expect(result).toHaveProperty('hero', null);
      expect(result).toHaveProperty('modules', null);
    });
  });

  describe('language scoping', () => {
    const dataset = [
      mockIndexPageDocument({
        _type: 'page_topicIndex',
        heading: MOCK_EN_HEADING,
        language: EN,
      }),
      mockIndexPageDocument({
        _type: 'page_topicIndex',
        heading: MOCK_NL_HEADING,
        language: NL,
      }),
    ];

    it.each([
      [EN, MOCK_EN_HEADING],
      [NL, MOCK_NL_HEADING],
    ])(
      'resolves the %s topic index page for its own language',
      async (locale, heading) => {
        const result = await evaluateGroqInLocale(
          topicIndexPageQuery.query,
          dataset,
          locale,
        );

        expect(result).toHaveProperty(HEADING_TEXT_PATH, heading);
      },
    );

    it('resolves nothing for a language without a topic index page', async () => {
      const result = await evaluateGroqInLocale(
        topicIndexPageQuery.query,
        dataset,
        FR,
      );

      expect(result).toBeNull();
    });

    describe('a topic index page with no language', () => {
      const legacy = [
        mockIndexPageDocument({
          _type: 'page_topicIndex',
          heading: MOCK_EN_HEADING,
        }),
      ];

      it('resolves for the default language', async () => {
        const result = await evaluateGroqInLocale(
          topicIndexPageQuery.query,
          legacy,
          EN,
        );

        expect(result).toHaveProperty(HEADING_TEXT_PATH, MOCK_EN_HEADING);
      });

      it('resolves nothing for any other language', async () => {
        const result = await evaluateGroqInLocale(
          topicIndexPageQuery.query,
          legacy,
          NL,
        );

        expect(result).toBeNull();
      });
    });

    it('lists the language of every topic index page as its translations', async () => {
      const result = await evaluateGroqInLocale(
        topicIndexPageQuery.query,
        dataset,
        NL,
      );

      expect(result).toHaveProperty('translations', [
        { language: EN },
        { language: NL },
      ]);
    });
  });
});
