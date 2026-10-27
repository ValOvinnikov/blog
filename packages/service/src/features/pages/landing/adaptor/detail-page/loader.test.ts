import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_ABOUT_PAGE_TITLE,
  mockContentSlotView,
  mockCtaSlotView,
  mockHeroSlotView,
  mockRawCtaRef,
  mockRawHeroRef,
  mockRawLandingPage,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_PAGE_LANDING_CACHE_TAG,
  MOCK_TEMPLATE_LANDING_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockRawSeo,
  mockSlug,
} from '@blog/service/testing/shared/fixtures';
import {
  MOCK_ABOUT_SLUG,
  MOCK_PRICING_SLUG,
} from '@blog/service/testing/shared/translated-pages-dataset';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getPageDocument } from './loader';
import { landingPageQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6015109);

const tenant = mockTenant();
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_SIDEBAR_TITLE = faker.lorem.words(2);

const MOCK_SECTION_SLUG = mockSlug();
const MOCK_FAQ_SLUG = mockSlug();
const MOCK_ANSWERS_SLUG = mockSlug();
const MOCK_GLOSSARY_SLUG = mockSlug();
const MOCK_CATALOG_SLUG = mockSlug();
const MOCK_FAQ_PATH = `${MOCK_SECTION_SLUG}/${MOCK_FAQ_SLUG}`;
const MOCK_PRICING_PATH = `${MOCK_SECTION_SLUG}/${MOCK_PRICING_SLUG}`;
const MOCK_ANSWERS_PATH = `${MOCK_FAQ_PATH}/${MOCK_ANSWERS_SLUG}`;
const MOCK_GLOSSARY_PATH = `${MOCK_FAQ_PATH}/${MOCK_GLOSSARY_SLUG}`;

async function loadPage(
  overrides: Parameters<typeof mockRawLandingPage>[0] = {},
  slug = MOCK_ABOUT_SLUG,
) {
  mockRun.mockResolvedValueOnce(mockRawLandingPage(overrides));
  const page = await getPageDocument([slug], tenant);
  if (!page) throw new Error('expected a landing page');

  return page;
}

describe(getPageDocument, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawLandingPage());
  });

  it('maps the thin page_landing document to module refs', async () => {
    const { id, path, modules } = await loadPage();

    expect({ id, path, modules }).toEqual({
      id: MOCK_ABOUT_SLUG,
      path: MOCK_ABOUT_SLUG,
      modules: [mockContentSlotView(), mockCtaSlotView()],
    });
  });

  it('maps an authored page_landing.headingBlock through to the view model', async () => {
    const { headingBlock } = await loadPage({
      headingBlock: mockRawHeadingBlock(MOCK_ABOUT_PAGE_TITLE, {
        supportingText: MOCK_SUPPORTING_TEXT,
      }),
    });

    expect(headingBlock.heading).toBe(MOCK_ABOUT_PAGE_TITLE);
    expect(headingBlock.supportingText).toBe(MOCK_SUPPORTING_TEXT);
  });

  it.each([
    ['leaves hero undefined when page_landing.hero is unset', null, undefined],
    [
      'maps a set page_landing.hero to a hero slot',
      mockRawHeroRef(),
      mockHeroSlotView(),
    ],
  ])('%s', async (_, hero, expected) => {
    const page = await loadPage({ hero });

    expect(page.hero).toEqual(expected);
  });

  it('rejects when page_landing.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawLandingPage({
        hero: mockRawCtaRef() as never,
      }),
    );

    await expect(getPageDocument([MOCK_ABOUT_SLUG], tenant)).rejects.toThrow();
  });

  it('uses authored seo, with no fallback for an unauthored openGraph', async () => {
    const { seo } = await loadPage({
      seo: mockRawSeo({ metaTitle: MOCK_ABOUT_PAGE_TITLE }),
    });

    expect(seo.title).toBe(MOCK_ABOUT_PAGE_TITLE);
    expect(seo.ogTitle).toBeUndefined();
  });

  it('resolves undefined when no page_landing matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const page = await getPageDocument([MOCK_MISSING_ID], tenant);

    expect(page).toBeUndefined();
  });

  it('queries the slug and path for the tenant and scopes the tags to it', async () => {
    await getPageDocument([MOCK_SECTION_SLUG, MOCK_FAQ_SLUG], tenant);

    expect(mockRun).toHaveBeenCalledWith(landingPageQuery, {
      parameters: { slug: MOCK_FAQ_SLUG, path: MOCK_FAQ_PATH },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_PAGE_LANDING_CACHE_TAG, MOCK_TEMPLATE_LANDING_CACHE_TAG],
      },
    });
  });

  describe('section navigation', () => {
    type TSectionPage = {
      _id: string;
      title: string | null;
      path: string | null;
    };

    function mockSectionPage(id: string, path: string): TSectionPage {
      return { _id: id, title: faker.lorem.words(2), path };
    }

    const faq = mockSectionPage(MOCK_FAQ_SLUG, MOCK_FAQ_PATH);
    const pricing = mockSectionPage(MOCK_PRICING_SLUG, MOCK_PRICING_PATH);
    const answers = mockSectionPage(MOCK_ANSWERS_SLUG, MOCK_ANSWERS_PATH);
    const glossary = mockSectionPage(MOCK_GLOSSARY_SLUG, MOCK_GLOSSARY_PATH);
    const catalog = mockSectionPage(MOCK_CATALOG_SLUG, MOCK_CATALOG_SLUG);
    const sectionRoot = mockSectionPage(MOCK_SECTION_SLUG, MOCK_SECTION_SLUG);

    function mockChainNode(
      page: TSectionPage,
      children: TSectionPage[] | null = null,
    ) {
      return {
        ...page,
        sectionNavigation: children !== null,
        sectionNavigationTitle: null,
        children,
      };
    }

    const modulesSection = mockChainNode(sectionRoot, [faq, pricing]);

    async function navigationFor(
      overrides: Parameters<typeof mockRawLandingPage>[0],
    ) {
      const page = await loadPage(overrides, MOCK_SECTION_SLUG);

      return page.sectionNavigation;
    }

    it("returns the section's children in drag order and the breadcrumb chain", async () => {
      expect(
        await navigationFor({
          sectionChain: [
            mockChainNode(answers),
            mockChainNode(faq),
            modulesSection,
          ],
        }),
      ).toEqual({
        title: null,
        root: {
          title: sectionRoot.title,
          path: MOCK_SECTION_SLUG,
          isCurrent: false,
        },
        pages: [
          { title: faq.title, path: MOCK_FAQ_PATH, isCurrent: true },
          { title: pricing.title, path: MOCK_PRICING_PATH, isCurrent: false },
        ],
        breadcrumbs: [
          { title: sectionRoot.title, path: MOCK_SECTION_SLUG },
          { title: faq.title, path: MOCK_FAQ_PATH },
          { title: answers.title, path: MOCK_ANSWERS_PATH },
        ],
        parentSection: undefined,
      });
    });

    it('marks the root as current on the section root itself', async () => {
      const navigation = await navigationFor({
        sectionChain: [modulesSection],
      });

      expect(navigation?.root.isCurrent).toBe(true);
      expect(navigation?.pages.map(({ isCurrent }) => isCurrent)).toEqual([
        false,
        false,
      ]);
    });

    it('returns the nested branch when a nested parent has its own switch on', async () => {
      const navigation = await navigationFor({
        sectionChain: [
          mockChainNode(answers),
          mockChainNode(faq, [glossary, answers]),
          modulesSection,
        ],
      });

      expect(navigation?.root).toEqual({
        title: faq.title,
        path: MOCK_FAQ_PATH,
        isCurrent: false,
      });
      expect(navigation?.pages).toEqual([
        { title: glossary.title, path: MOCK_GLOSSARY_PATH, isCurrent: false },
        { title: answers.title, path: MOCK_ANSWERS_PATH, isCurrent: true },
      ]);
    });

    it("returns the nearest outer section root as a nested section's parent", async () => {
      const navigation = await navigationFor({
        sectionChain: [
          mockChainNode(answers),
          mockChainNode(faq, [glossary, answers]),
          mockChainNode(catalog),
          modulesSection,
        ],
      });

      expect(navigation?.parentSection).toEqual({
        title: sectionRoot.title,
        path: MOCK_SECTION_SLUG,
      });
    });

    it('returns no parent section for a top-level section', async () => {
      const navigation = await navigationFor({
        sectionChain: [
          mockChainNode(faq),
          modulesSection,
          mockChainNode(catalog),
        ],
      });

      expect(navigation?.parentSection).toBeUndefined();
    });

    it.each([
      [MOCK_SIDEBAR_TITLE, MOCK_SIDEBAR_TITLE],
      ['   ', null],
    ])(
      "maps the section root's sidebar title %j to %j",
      async (sectionNavigationTitle, title) => {
        const navigation = await navigationFor({
          sectionChain: [
            mockChainNode(faq),
            { ...modulesSection, sectionNavigationTitle },
          ],
        });

        expect(navigation?.title).toBe(title);
      },
    );

    it("takes the title from the nested section root, not an outer section's", async () => {
      const navigation = await navigationFor({
        sectionChain: [
          mockChainNode(answers),
          mockChainNode(faq, [glossary, answers]),
          { ...modulesSection, sectionNavigationTitle: MOCK_SIDEBAR_TITLE },
        ],
      });

      expect(navigation?.title).toBeNull();
    });

    it('leaves out a child page that has no path', async () => {
      const navigation = await navigationFor({
        sectionChain: [
          mockChainNode(sectionRoot, [faq, { ...pricing, path: null }]),
        ],
      });

      expect(navigation?.pages.map(({ path }) => path)).toEqual([
        MOCK_FAQ_PATH,
      ]);
    });

    it.each([
      [
        'the page turns section navigation off',
        {
          showSectionNavigation: false,
          sectionChain: [mockChainNode(faq), modulesSection],
        },
      ],
      [
        'the page is outside any section',
        {
          sectionChain: [mockChainNode(faq), mockChainNode(sectionRoot)],
        },
      ],
    ])('returns none when %s', async (_, overrides) => {
      expect(await navigationFor(overrides)).toBeUndefined();
    });
  });
});
