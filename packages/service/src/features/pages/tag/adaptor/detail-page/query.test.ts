import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_TAG_TITLE } from '@blog/service/testing/entities/fixtures';
import {
  MOCK_TEMPLATE_REFERENCE,
  mockRawCtaRef,
  mockRawHeroRef,
  mockRawPostLatestRef,
  mockRawTagPage,
  mockSlugPageDocument,
  mockTemplateLayoutDocuments,
  mockTemplatedPageDocument,
  mockTranslatedSlugPageDocuments,
} from '@blog/service/testing/pages/fixtures';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { tagPageQuery } from './query';

faker.seed(601503);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const MOCK_PAGE_SLUG = faker.lorem.slug();
const MOCK_POST_LIST_MODULE_ID = faker.string.uuid();
const MOCK_EN_HEADING = faker.lorem.words(2);
const MOCK_NL_HEADING = faker.lorem.words(2);

describe('tagPageQuery', () => {
  it.each([
    ['with no modules', mockRawTagPage({ modules: null })],
    [
      'with a list module alongside other modules, and SEO',
      mockRawTagPage({
        modules: [
          { _id: MOCK_POST_LIST_MODULE_ID, _type: 'module_postList' },
          mockRawCtaRef(),
        ],
        seo: {
          metaTitle: MOCK_TAG_TITLE,
          metaDescription: null,
          openGraph: null,
        },
      }),
    ],
    ['with its hero slot set', mockRawTagPage({ hero: mockRawHeroRef() })],
    [
      'with an authored headingBlock',
      mockRawTagPage({ headingBlock: mockRawHeadingBlock(MOCK_TAG_TITLE) }),
    ],
  ])('parses a tag page %s', (_, raw) => {
    expect(() => tagPageQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['authored SEO', { ...mockRawTagPage(), seo: null }],
    ['heading block', { ...mockRawTagPage(), headingBlock: null }],
  ])('rejects a tag page with no %s', (_, raw) => {
    expect(() => tagPageQuery.parse(raw)).toThrow();
  });

  it('parses null as no matching page_tag document', () => {
    expect(tagPageQuery.parse(null)).toBeNull();
  });

  describe('template layout', () => {
    const dataset = mockTemplateLayoutDocuments({ _type: 'template_tag' });
    const pageFields = { slug: MOCK_PAGE_SLUG, language: EN };

    function run(data: unknown[]): Promise<unknown> {
      return evaluateGroqExpression(tagPageQuery.query, data, null, {
        slug: MOCK_PAGE_SLUG,
        locale: EN,
      });
    }

    it('resolves the hero and modules of the template the tag page references', async () => {
      const page = mockTemplatedPageDocument({
        ...mockSlugPageDocument({ _type: 'page_tag', ...pageFields }),
        template: MOCK_TEMPLATE_REFERENCE,
      });

      const result = await run([page, ...dataset]);

      expect(result).toHaveProperty('hero', mockRawHeroRef());
      expect(result).toHaveProperty('modules', [mockRawPostLatestRef()]);
    });

    it('resolves no hero and no modules for a tag page without a template', async () => {
      const page = mockSlugPageDocument({ _type: 'page_tag', ...pageFields });

      const result = await run([page, ...dataset]);

      expect(result).toHaveProperty('hero', null);
      expect(result).toHaveProperty('modules', null);
    });
  });

  describe('language scoping', () => {
    const dataset = mockTranslatedSlugPageDocuments({
      _type: 'page_tag',
      slug: MOCK_PAGE_SLUG,
      headings: { [EN]: MOCK_EN_HEADING, [NL]: MOCK_NL_HEADING },
    });

    function run(locale: string): Promise<unknown> {
      return evaluateGroqExpression(tagPageQuery.query, dataset, null, {
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
