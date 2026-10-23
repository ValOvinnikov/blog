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
} from '@blog/service/testing/shared/fixtures';
import {
  MOCK_ABOUT_SLUG,
  MOCK_PRICING_SLUG,
} from '@blog/service/testing/shared/translated-pages-dataset';
import { mockTenant } from '@blog/service/testing/tenant';

import { getPageDocument } from './loader';
import { landingPageQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const ABOUT_TITLE = MOCK_ABOUT_PAGE_TITLE;
const ABOUT_SUPPORTING_TEXT = 'Who we are';
const MODULES_PATH = 'modules';
const FAQ_SLUG = 'faq';
const FAQ_PATH = `${MODULES_PATH}/${FAQ_SLUG}`;
const PRICING_PATH = 'modules/pricing';
const ANSWERS_PATH = 'modules/faq/answers';
const GLOSSARY_PATH = 'modules/faq/glossary';

const tenant = mockTenant();

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
      headingBlock: mockRawHeadingBlock(ABOUT_TITLE, {
        supportingText: ABOUT_SUPPORTING_TEXT,
      }),
    });

    expect(headingBlock.heading).toBe(ABOUT_TITLE);
    expect(headingBlock.supportingText).toBe(ABOUT_SUPPORTING_TEXT);
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
      seo: mockRawSeo({ metaTitle: ABOUT_TITLE }),
    });

    expect(seo.title).toBe(ABOUT_TITLE);
    expect(seo.ogTitle).toBeUndefined();
  });

  it('resolves undefined when no page_landing matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const page = await getPageDocument([MOCK_MISSING_ID], tenant);

    expect(page).toBeUndefined();
  });

  it('queries the slug and path for the tenant and scopes the tags to it', async () => {
    await getPageDocument([MODULES_PATH, FAQ_SLUG], tenant);

    expect(mockRun).toHaveBeenCalledWith(landingPageQuery, {
      parameters: { slug: FAQ_SLUG, path: FAQ_PATH },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_PAGE_LANDING_CACHE_TAG, MOCK_TEMPLATE_LANDING_CACHE_TAG],
      },
    });
  });

  describe('section navigation', () => {
    const faq = { _id: FAQ_SLUG, title: 'FAQ', path: FAQ_PATH };
    const pricing = {
      _id: MOCK_PRICING_SLUG,
      title: 'Pricing',
      path: PRICING_PATH,
    };
    const answers = {
      _id: 'answers',
      title: 'Answers',
      path: ANSWERS_PATH,
    };
    const glossary = {
      _id: 'glossary',
      title: 'Glossary',
      path: GLOSSARY_PATH,
    };

    type TSectionPage = {
      _id: string;
      title: string | null;
      path: string | null;
    };

    function chainNode(
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

    const modulesSection = chainNode(
      { _id: MODULES_PATH, title: 'Modules', path: MODULES_PATH },
      [faq, pricing],
    );

    async function navigationFor(
      overrides: Parameters<typeof mockRawLandingPage>[0],
    ) {
      const page = await loadPage(overrides, MODULES_PATH);

      return page.sectionNavigation;
    }

    it("returns the section's children in drag order and the breadcrumb chain", async () => {
      expect(
        await navigationFor({
          sectionChain: [chainNode(answers), chainNode(faq), modulesSection],
        }),
      ).toEqual({
        title: null,
        root: { title: 'Modules', path: MODULES_PATH, isCurrent: false },
        pages: [
          { title: 'FAQ', path: FAQ_PATH, isCurrent: true },
          { title: 'Pricing', path: PRICING_PATH, isCurrent: false },
        ],
        breadcrumbs: [
          { title: 'Modules', path: MODULES_PATH },
          { title: 'FAQ', path: FAQ_PATH },
          { title: 'Answers', path: ANSWERS_PATH },
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
          chainNode(answers),
          chainNode(faq, [glossary, answers]),
          modulesSection,
        ],
      });

      expect(navigation?.root).toEqual({
        title: 'FAQ',
        path: FAQ_PATH,
        isCurrent: false,
      });
      expect(navigation?.pages).toEqual([
        { title: 'Glossary', path: GLOSSARY_PATH, isCurrent: false },
        { title: 'Answers', path: ANSWERS_PATH, isCurrent: true },
      ]);
    });

    it("returns the nearest outer section root as a nested section's parent", async () => {
      const navigation = await navigationFor({
        sectionChain: [
          chainNode(answers),
          chainNode(faq, [glossary, answers]),
          chainNode({ _id: 'catalog', title: 'Catalog', path: 'catalog' }),
          modulesSection,
        ],
      });

      expect(navigation?.parentSection).toEqual({
        title: 'Modules',
        path: MODULES_PATH,
      });
    });

    it('returns no parent section for a top-level section', async () => {
      const navigation = await navigationFor({
        sectionChain: [
          chainNode(faq),
          modulesSection,
          chainNode({ _id: 'catalog', title: 'Catalog', path: 'catalog' }),
        ],
      });

      expect(navigation?.parentSection).toBeUndefined();
    });

    it.each([
      ['Guides', 'Guides'],
      ['   ', null],
    ])(
      "maps the section root's sidebar title %j to %j",
      async (sectionNavigationTitle, title) => {
        const navigation = await navigationFor({
          sectionChain: [
            chainNode(faq),
            { ...modulesSection, sectionNavigationTitle },
          ],
        });

        expect(navigation?.title).toBe(title);
      },
    );

    it("takes the title from the nested section root, not an outer section's", async () => {
      const navigation = await navigationFor({
        sectionChain: [
          chainNode(answers),
          chainNode(faq, [glossary, answers]),
          { ...modulesSection, sectionNavigationTitle: 'Guides' },
        ],
      });

      expect(navigation?.title).toBeNull();
    });

    it('leaves out a child page that has no path', async () => {
      const navigation = await navigationFor({
        sectionChain: [
          chainNode(
            { _id: MODULES_PATH, title: 'Modules', path: MODULES_PATH },
            [faq, { ...pricing, path: null }],
          ),
        ],
      });

      expect(navigation?.pages.map(({ path }) => path)).toEqual([FAQ_PATH]);
    });

    it('returns none when the page turns section navigation off', async () => {
      expect(
        await navigationFor({
          showSectionNavigation: false,
          sectionChain: [chainNode(faq), modulesSection],
        }),
      ).toBeUndefined();
    });

    it('returns none for a page outside any section', async () => {
      expect(
        await navigationFor({
          sectionChain: [
            chainNode(faq),
            chainNode({
              _id: MODULES_PATH,
              title: 'Modules',
              path: MODULES_PATH,
            }),
          ],
        }),
      ).toBeUndefined();
    });
  });
});
