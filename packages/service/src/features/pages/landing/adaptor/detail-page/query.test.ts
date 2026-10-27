import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_CONTENT_MODULE_ID,
  MOCK_CTA_MODULE_ID,
} from '@blog/service/testing/modules/fixtures';
import {
  HEADING_TEXT_PATH,
  MOCK_ABOUT_PAGE_TITLE,
  MOCK_HERO_MODULE_ID,
  mockRawContentRef,
  mockRawCtaRef,
  mockRawLandingPage,
} from '@blog/service/testing/pages/fixtures';
import {
  mockRawHeadingBlock,
  mockReference,
  mockSlug,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_ABOUT_EN_PAGE_ID,
  MOCK_ABOUT_NL_PAGE_ID,
  MOCK_ABOUT_SLUG,
  MOCK_ABOUT_TRANSLATION_METADATA,
  MOCK_PRICING_NL_SLUG,
  MOCK_PRICING_SLUG,
} from '@blog/service/testing/shared/translated-pages-dataset';
import { faker } from '@faker-js/faker';

import { landingPageQuery } from './query';

faker.seed(6015108);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const MOCK_TEMPLATE_ID = faker.string.uuid();
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_EN_HEADING = faker.lorem.words(2);
const MOCK_NL_HEADING = faker.lorem.words(3);
const MOCK_LEGACY_SLUG = mockSlug();
const MOCK_SECTION_SLUG = mockSlug();
const MOCK_FAQ_SLUG = mockSlug();
const MOCK_ANSWERS_SLUG = mockSlug();
const MOCK_SIDEBAR_TITLE = faker.lorem.words(2);
const MOCK_FAQ_PATH = `${MOCK_SECTION_SLUG}/${MOCK_FAQ_SLUG}`;

function runAtPath(dataset: unknown[], segments: string[]): Promise<unknown> {
  return evaluateGroqExpression(landingPageQuery.query, dataset, null, {
    slug: segments.at(-1),
    path: segments.join('/'),
    locale: EN,
    defaultLocale: EN,
  });
}

describe('landingPageQuery', () => {
  it.each([
    ['with no modules', mockRawLandingPage({ modules: null })],
    [
      'with its hero slot set',
      mockRawLandingPage({
        hero: { _id: MOCK_HERO_MODULE_ID, _type: 'module_heroBlog' },
      }),
    ],
    [
      'with a headingBlock heading and supportingText',
      mockRawLandingPage({
        headingBlock: mockRawHeadingBlock(MOCK_ABOUT_PAGE_TITLE, {
          supportingText: MOCK_SUPPORTING_TEXT,
        }),
      }),
    ],
  ])('parses a landing page %s', (_, raw) => {
    expect(() => landingPageQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['authored SEO', { ...mockRawLandingPage(), seo: null }],
    ['heading block', { ...mockRawLandingPage(), headingBlock: null }],
  ])('rejects a landing page with no %s', (_, raw) => {
    expect(() => landingPageQuery.parse(raw)).toThrow();
  });

  it('parses a landing page that has no translation group', () => {
    const raw = { ...mockRawLandingPage(), translations: null };

    expect(landingPageQuery.parse(raw)?.translations).toBeNull();
  });

  it('parses null as no matching page_landing document', () => {
    expect(landingPageQuery.parse(null)).toBeNull();
  });

  describe('language scoping', () => {
    function mockLandingDocument(
      id: string,
      slug: string,
      heading: string,
      language?: string,
    ) {
      return {
        _id: id,
        _type: 'page_landing',
        slug: { current: slug },
        headingBlock: { heading },
        ...(language ? { language } : {}),
      };
    }

    const dataset = [
      mockLandingDocument(
        MOCK_ABOUT_EN_PAGE_ID,
        MOCK_ABOUT_SLUG,
        MOCK_EN_HEADING,
        EN,
      ),
      mockLandingDocument(
        MOCK_ABOUT_NL_PAGE_ID,
        MOCK_ABOUT_SLUG,
        MOCK_NL_HEADING,
        NL,
      ),
      mockLandingDocument(
        faker.string.uuid(),
        MOCK_LEGACY_SLUG,
        faker.lorem.words(2),
      ),
      MOCK_ABOUT_TRANSLATION_METADATA,
    ];

    function run(slug: string, locale: string): Promise<unknown> {
      return evaluateGroqExpression(landingPageQuery.query, dataset, null, {
        slug,
        path: slug,
        locale,
        defaultLocale: EN,
      });
    }

    it('resolves the same slug to a different page per language', async () => {
      expect(await run(MOCK_ABOUT_SLUG, EN)).toHaveProperty(
        HEADING_TEXT_PATH,
        MOCK_EN_HEADING,
      );
      expect(await run(MOCK_ABOUT_SLUG, NL)).toHaveProperty(
        HEADING_TEXT_PATH,
        MOCK_NL_HEADING,
      );
    });

    it('resolves nothing for a language the page is not authored in', async () => {
      expect(await run(MOCK_ABOUT_SLUG, FR)).toBeNull();
    });

    it('resolves nothing for a page with no language', async () => {
      expect(await run(MOCK_LEGACY_SLUG, EN)).toBeNull();
      expect(await run(MOCK_LEGACY_SLUG, NL)).toBeNull();
    });

    it('returns the linked translations with their languages and slugs', async () => {
      expect(await run(MOCK_ABOUT_SLUG, NL)).toHaveProperty('translations', [
        { language: EN, slug: MOCK_ABOUT_SLUG },
        { language: NL, slug: MOCK_ABOUT_SLUG },
      ]);
    });
  });

  describe('template layout', () => {
    function mockLandingDocument(
      id: string,
      language: string,
      template?: string,
    ) {
      return {
        _id: id,
        _type: 'page_landing',
        slug: { current: MOCK_ABOUT_SLUG },
        language,
        headingBlock: { heading: id },
        ...(template ? { template: mockReference(template) } : {}),
      };
    }

    const dataset = [
      mockLandingDocument(MOCK_ABOUT_EN_PAGE_ID, EN, MOCK_TEMPLATE_ID),
      mockLandingDocument(MOCK_ABOUT_NL_PAGE_ID, NL, MOCK_TEMPLATE_ID),
      {
        _id: MOCK_TEMPLATE_ID,
        _type: 'template_landing',
        hero: mockReference(MOCK_HERO_MODULE_ID),
        modules: [
          mockReference(MOCK_CONTENT_MODULE_ID, { _key: 'a' }),
          mockReference(MOCK_CTA_MODULE_ID, { _key: 'b' }),
        ],
      },
      { _id: MOCK_HERO_MODULE_ID, _type: 'module_heroStatement' },
      mockRawContentRef(),
      mockRawCtaRef(),
    ];

    function run(data: unknown[], locale: string): Promise<unknown> {
      return evaluateGroqExpression(landingPageQuery.query, data, null, {
        slug: MOCK_ABOUT_SLUG,
        path: MOCK_ABOUT_SLUG,
        locale,
        defaultLocale: EN,
      });
    }

    it.each([EN, NL])(
      'resolves the hero and modules of the template the %s page references',
      async (locale) => {
        const result = await run(dataset, locale);

        expect(result).toHaveProperty('hero', {
          _id: MOCK_HERO_MODULE_ID,
          _type: 'module_heroStatement',
        });
        expect(result).toHaveProperty('modules', [
          mockRawContentRef(),
          mockRawCtaRef(),
        ]);
      },
    );

    it('resolves no hero and no modules for a page without a template', async () => {
      const withoutTemplate = [mockLandingDocument(MOCK_ABOUT_EN_PAGE_ID, EN)];

      const result = await run(withoutTemplate, EN);

      expect(result).toHaveProperty('hero', null);
      expect(result).toHaveProperty('modules', null);
    });
  });

  describe('nested paths', () => {
    function mockLandingDocument(id: string, slug: string, parent?: string) {
      return {
        _id: id,
        _type: 'page_landing',
        slug: { current: slug },
        language: EN,
        headingBlock: { heading: id },
        ...(parent ? { parent: mockReference(parent) } : {}),
      };
    }

    const dataset = [
      mockLandingDocument(MOCK_SECTION_SLUG, MOCK_SECTION_SLUG),
      mockLandingDocument(MOCK_FAQ_SLUG, MOCK_FAQ_SLUG, MOCK_SECTION_SLUG),
      mockLandingDocument(MOCK_PRICING_SLUG, MOCK_PRICING_SLUG),
    ];

    it('resolves a nested page at its full path', async () => {
      const result = await runAtPath(dataset, [
        MOCK_SECTION_SLUG,
        MOCK_FAQ_SLUG,
      ]);

      expect(result).toHaveProperty('_id', MOCK_FAQ_SLUG);
      expect(result).toHaveProperty('path', MOCK_FAQ_PATH);
      expect(result).toHaveProperty(HEADING_TEXT_PATH, MOCK_FAQ_SLUG);
    });

    it('resolves nothing for a nested page at its bare slug', async () => {
      expect(await runAtPath(dataset, [MOCK_FAQ_SLUG])).toBeNull();
    });

    it('resolves nothing for a top-level page under a parent it does not have', async () => {
      expect(
        await runAtPath(dataset, [MOCK_SECTION_SLUG, MOCK_PRICING_SLUG]),
      ).toBeNull();
    });

    it('resolves a top-level page at its slug', async () => {
      expect(await runAtPath(dataset, [MOCK_PRICING_SLUG])).toHaveProperty(
        'path',
        MOCK_PRICING_SLUG,
      );
    });
  });

  describe('section chain', () => {
    function mockLandingDocument(
      id: string,
      {
        parent,
        orderRank,
        sectionNavigation,
        sectionNavigationTitle,
        language = EN,
      }: {
        parent?: string;
        orderRank?: string;
        sectionNavigation?: boolean;
        sectionNavigationTitle?: string;
        language?: string;
      } = {},
    ) {
      return {
        _id: id,
        _type: 'page_landing',
        slug: { current: id },
        language,
        headingBlock: { heading: `${id} heading` },
        ...(orderRank ? { orderRank } : {}),
        ...(sectionNavigation === undefined ? {} : { sectionNavigation }),
        ...(sectionNavigationTitle ? { sectionNavigationTitle } : {}),
        ...(parent ? { parent: mockReference(parent) } : {}),
      };
    }

    const dataset = [
      mockLandingDocument(MOCK_SECTION_SLUG, {
        sectionNavigation: true,
        sectionNavigationTitle: MOCK_SIDEBAR_TITLE,
      }),
      mockLandingDocument(MOCK_PRICING_SLUG, {
        parent: MOCK_SECTION_SLUG,
        orderRank: '0|b',
      }),
      mockLandingDocument(MOCK_FAQ_SLUG, {
        parent: MOCK_SECTION_SLUG,
        orderRank: '0|a',
      }),
      mockLandingDocument(MOCK_PRICING_NL_SLUG, {
        parent: MOCK_SECTION_SLUG,
        orderRank: '0|0',
        language: NL,
      }),
      mockLandingDocument(MOCK_ANSWERS_SLUG, { parent: MOCK_FAQ_SLUG }),
    ];

    function mockChainEntry(
      id: string,
      path: string,
      overrides: Record<string, unknown> = {},
    ) {
      return {
        _id: id,
        path,
        title: `${id} heading`,
        sectionNavigation: false,
        sectionNavigationTitle: null,
        children: null,
        ...overrides,
      };
    }

    const sectionRootEntry = mockChainEntry(
      MOCK_SECTION_SLUG,
      MOCK_SECTION_SLUG,
      {
        sectionNavigation: true,
        sectionNavigationTitle: MOCK_SIDEBAR_TITLE,
        children: [
          {
            _id: MOCK_FAQ_SLUG,
            title: `${MOCK_FAQ_SLUG} heading`,
            path: MOCK_FAQ_PATH,
          },
          {
            _id: MOCK_PRICING_SLUG,
            title: `${MOCK_PRICING_SLUG} heading`,
            path: `${MOCK_SECTION_SLUG}/${MOCK_PRICING_SLUG}`,
          },
        ],
      },
    );

    it('returns the page and its ancestors, nearest first', async () => {
      expect(
        await runAtPath(dataset, [
          MOCK_SECTION_SLUG,
          MOCK_FAQ_SLUG,
          MOCK_ANSWERS_SLUG,
        ]),
      ).toHaveProperty('sectionChain', [
        mockChainEntry(
          MOCK_ANSWERS_SLUG,
          `${MOCK_FAQ_PATH}/${MOCK_ANSWERS_SLUG}`,
        ),
        mockChainEntry(MOCK_FAQ_SLUG, MOCK_FAQ_PATH),
        sectionRootEntry,
      ]);
    });

    it("returns a section root's children in drag order, in the page's language", async () => {
      expect(
        await runAtPath(dataset, [MOCK_SECTION_SLUG, MOCK_FAQ_SLUG]),
      ).toHaveProperty('sectionChain', [
        mockChainEntry(MOCK_FAQ_SLUG, MOCK_FAQ_PATH),
        sectionRootEntry,
      ]);
    });
  });
});
