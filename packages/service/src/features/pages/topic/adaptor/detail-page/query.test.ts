import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_TOPIC_TITLE } from '@blog/service/testing/entities/fixtures';
import {
  MOCK_TEMPLATE_REFERENCE,
  mockRawCtaRef,
  mockRawHeroRef,
  mockRawPostLatestRef,
  mockRawTopicPage,
  mockSlugPageDocument,
  mockTemplateLayoutDocuments,
  mockTemplatedPageDocument,
  mockTranslatedSlugPageDocuments,
} from '@blog/service/testing/pages/fixtures';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { topicPageQuery } from './query';

faker.seed(601603);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const MOCK_PAGE_SLUG = faker.lorem.slug();
const MOCK_POST_LIST_MODULE_ID = faker.string.uuid();
const MOCK_EN_HEADING = faker.lorem.words(2);
const MOCK_NL_HEADING = faker.lorem.words(2);

describe('topicPageQuery', () => {
  it.each([
    ['with no modules', mockRawTopicPage({ modules: null })],
    [
      'with a list module alongside other modules, and SEO',
      mockRawTopicPage({
        modules: [
          { _id: MOCK_POST_LIST_MODULE_ID, _type: 'module_postList' },
          mockRawCtaRef(),
        ],
        seo: {
          metaTitle: MOCK_TOPIC_TITLE,
          metaDescription: null,
          openGraph: null,
        },
      }),
    ],
    ['with its hero slot set', mockRawTopicPage({ hero: mockRawHeroRef() })],
    [
      'with an authored headingBlock',
      mockRawTopicPage({ headingBlock: mockRawHeadingBlock(MOCK_TOPIC_TITLE) }),
    ],
  ])('parses a topic page %s', (_, raw) => {
    expect(() => topicPageQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['authored SEO', { ...mockRawTopicPage(), seo: null }],
    ['heading block', { ...mockRawTopicPage(), headingBlock: null }],
  ])('rejects a topic page with no %s', (_, raw) => {
    expect(() => topicPageQuery.parse(raw)).toThrow();
  });

  it('parses null as no matching page_topic document', () => {
    expect(topicPageQuery.parse(null)).toBeNull();
  });

  describe('template layout', () => {
    const dataset = mockTemplateLayoutDocuments({ _type: 'template_topic' });
    const pageFields = { slug: MOCK_PAGE_SLUG, language: EN };

    function run(data: unknown[]): Promise<unknown> {
      return evaluateGroqExpression(topicPageQuery.query, data, null, {
        slug: MOCK_PAGE_SLUG,
        locale: EN,
      });
    }

    it('resolves the hero and modules of the template the topic page references', async () => {
      const page = mockTemplatedPageDocument({
        ...mockSlugPageDocument({ _type: 'page_topic', ...pageFields }),
        template: MOCK_TEMPLATE_REFERENCE,
      });

      const result = await run([page, ...dataset]);

      expect(result).toHaveProperty('hero', mockRawHeroRef());
      expect(result).toHaveProperty('modules', [mockRawPostLatestRef()]);
    });

    it('resolves no hero and no modules for a topic page without a template', async () => {
      const page = mockSlugPageDocument({ _type: 'page_topic', ...pageFields });

      const result = await run([page, ...dataset]);

      expect(result).toHaveProperty('hero', null);
      expect(result).toHaveProperty('modules', null);
    });
  });

  describe('language scoping', () => {
    const dataset = mockTranslatedSlugPageDocuments({
      _type: 'page_topic',
      slug: MOCK_PAGE_SLUG,
      headings: { [EN]: MOCK_EN_HEADING, [NL]: MOCK_NL_HEADING },
    });

    function run(locale: string): Promise<unknown> {
      return evaluateGroqExpression(topicPageQuery.query, dataset, null, {
        slug: MOCK_PAGE_SLUG,
        locale,
        defaultLocale: EN,
      });
    }

    it.each([
      [EN, MOCK_EN_HEADING],
      [NL, MOCK_NL_HEADING],
    ])('resolves the %s page for the same slug', async (locale, heading) => {
      const result = await run(locale);

      expect(result).toHaveProperty('headingBlock.heading', heading);
    });

    it('resolves nothing for a language the page is not authored in', async () => {
      const result = await run(FR);

      expect(result).toBeNull();
    });

    it('returns the linked translations with their languages and slugs', async () => {
      const result = await run(NL);

      expect(result).toHaveProperty('translations', [
        { language: EN, slug: MOCK_PAGE_SLUG },
        { language: NL, slug: MOCK_PAGE_SLUG },
      ]);
    });
  });
});
