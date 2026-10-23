import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_CONTENT_MODULE_ID,
  MOCK_CTA_MODULE_ID,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_ABOUT_PAGE_TITLE,
  MOCK_HERO_MODULE_ID,
  mockRawContentRef,
  mockRawCtaRef,
  mockRawLandingPage,
} from '@blog/service/testing/pages/fixtures';
import {
  mockRawHeadingBlock,
  mockReference,
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

import { landingPageQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;
const TEMPLATE_ID = 'template-about';
const FAQ_PATH = 'modules/faq';

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
          supportingText: 'Who we are',
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

  it('parses null as no matching page_landing document, rather than throwing', () => {
    expect(landingPageQuery.parse(null)).toBeNull();
  });
});

describe('landingPageQuery language scoping', () => {
  function landing(
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
    landing(MOCK_ABOUT_EN_PAGE_ID, MOCK_ABOUT_SLUG, 'About', EN),
    landing(MOCK_ABOUT_NL_PAGE_ID, MOCK_ABOUT_SLUG, 'Over ons', NL),
    landing('legacy', 'legacy', 'Legacy'),
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
    expect(await run(MOCK_ABOUT_SLUG, EN)).toMatchObject({
      headingBlock: { heading: 'About' },
    });
    expect(await run(MOCK_ABOUT_SLUG, NL)).toMatchObject({
      headingBlock: { heading: 'Over ons' },
    });
  });

  it('resolves nothing for a language the page is not authored in', async () => {
    expect(await run(MOCK_ABOUT_SLUG, FR)).toBeNull();
  });

  it('resolves nothing for a page with no language', async () => {
    expect(await run('legacy', EN)).toBeNull();
    expect(await run('legacy', NL)).toBeNull();
  });

  it('returns the linked translations with their languages and slugs', async () => {
    expect(await run(MOCK_ABOUT_SLUG, NL)).toMatchObject({
      translations: [
        { language: EN, slug: MOCK_ABOUT_SLUG },
        { language: NL, slug: MOCK_ABOUT_SLUG },
      ],
    });
  });
});

describe('landingPageQuery template layout', () => {
  function landing(id: string, language: string, template?: string) {
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
    landing(MOCK_ABOUT_EN_PAGE_ID, EN, TEMPLATE_ID),
    landing(MOCK_ABOUT_NL_PAGE_ID, NL, TEMPLATE_ID),
    {
      _id: TEMPLATE_ID,
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
      expect(await run(dataset, locale)).toMatchObject({
        hero: { _id: MOCK_HERO_MODULE_ID, _type: 'module_heroStatement' },
        modules: [mockRawContentRef(), mockRawCtaRef()],
      });
    },
  );

  it('resolves no hero and no modules for a page without a template', async () => {
    expect(await run([landing(MOCK_ABOUT_EN_PAGE_ID, EN)], EN)).toMatchObject({
      hero: null,
      modules: null,
    });
  });
});

describe('landingPageQuery nested paths', () => {
  function landing(id: string, slug: string, parent?: string) {
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
    landing('modules', 'modules'),
    landing('faq', 'faq', 'modules'),
    landing(MOCK_PRICING_SLUG, MOCK_PRICING_SLUG),
  ];

  it('resolves a nested page at its full path', async () => {
    expect(await runAtPath(dataset, ['modules', 'faq'])).toMatchObject({
      _id: 'faq',
      path: FAQ_PATH,
      headingBlock: { heading: 'faq' },
    });
  });

  it('resolves nothing for a nested page at its bare slug', async () => {
    expect(await runAtPath(dataset, ['faq'])).toBeNull();
  });

  it('resolves nothing for a top-level page under a parent it does not have', async () => {
    expect(await runAtPath(dataset, ['modules', MOCK_PRICING_SLUG])).toBeNull();
  });

  it('resolves a top-level page at its slug', async () => {
    expect(await runAtPath(dataset, [MOCK_PRICING_SLUG])).toMatchObject({
      path: MOCK_PRICING_SLUG,
    });
  });
});

describe('landingPageQuery section chain', () => {
  function landing(
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
    landing('modules', {
      sectionNavigation: true,
      sectionNavigationTitle: 'Guides',
    }),
    landing(MOCK_PRICING_SLUG, { parent: 'modules', orderRank: '0|b' }),
    landing('faq', { parent: 'modules', orderRank: '0|a' }),
    landing(MOCK_PRICING_NL_SLUG, {
      parent: 'modules',
      orderRank: '0|0',
      language: NL,
    }),
    landing('answers', { parent: 'faq' }),
  ];

  it('returns the page and its ancestors, nearest first', async () => {
    expect(
      await runAtPath(dataset, ['modules', 'faq', 'answers']),
    ).toMatchObject({
      sectionChain: [
        { _id: 'answers', path: `${FAQ_PATH}/answers` },
        { _id: 'faq', path: FAQ_PATH },
        { _id: 'modules', path: 'modules' },
      ],
    });
  });

  it("returns a section root's children in drag order, in the page's language", async () => {
    expect(await runAtPath(dataset, ['modules', 'faq'])).toMatchObject({
      sectionChain: [
        { _id: 'faq', sectionNavigation: false, children: null },
        {
          _id: 'modules',
          title: 'modules heading',
          sectionNavigation: true,
          children: [
            { _id: 'faq', title: 'faq heading', path: FAQ_PATH },
            {
              _id: MOCK_PRICING_SLUG,
              title: 'pricing heading',
              path: 'modules/pricing',
            },
          ],
        },
      ],
    });
  });

  it("returns each page's sidebar title, or null where none is set", async () => {
    expect(await runAtPath(dataset, ['modules', 'faq'])).toMatchObject({
      sectionChain: [
        { _id: 'faq', sectionNavigationTitle: null },
        { _id: 'modules', sectionNavigationTitle: 'Guides' },
      ],
    });
  });
});
