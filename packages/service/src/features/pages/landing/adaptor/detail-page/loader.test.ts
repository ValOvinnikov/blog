import { faker } from '@faker-js/faker';
import {
  SANITY_CONTENT_REVALIDATE_SECONDS,
  type TMaybeNull,
} from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import {
  MOCK_ABOUT_PAGE_TITLE,
  mockContentSlotView,
  mockCtaSlotView,
  mockHeroSlotView,
  mockRawCtaRef,
  mockRawHeroRef,
} from '@shinefold/service/testing/pages/fixtures';
import { mockRawLandingPage } from '@shinefold/service/testing/pages/landing-page/fixtures';
import {
  MOCK_PAGE_LANDING_CACHE_TAG,
  MOCK_TEMPLATE_LANDING_CACHE_TAG,
} from '@shinefold/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockRawSeo,
  mockSlug,
} from '@shinefold/service/testing/shared/fixtures';
import {
  MOCK_ABOUT_SLUG,
  MOCK_PRICING_SLUG,
} from '@shinefold/service/testing/shared/translated-pages-dataset';
import { mockTenant } from '@shinefold/service/testing/tenant';
import { isNull } from '@shinefold/utils/primitives';

import { getPageDocument } from './loader';
import { landingPageQuery, type TRawLandingPage } from './query';
import type { TRawSectionTreePage } from './section-navigation';

vi.mock('@shinefold/service/sanity/query/query');

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

function mockSectionPage(id: string, path: string): TRawSectionTreePage {
  return { _id: id, title: faker.lorem.words(2), path };
}

function toLink({ title, path }: TRawSectionTreePage) {
  return { title, path };
}

const faq = mockSectionPage(MOCK_FAQ_SLUG, MOCK_FAQ_PATH);
const pricing = mockSectionPage(MOCK_PRICING_SLUG, MOCK_PRICING_PATH);
const answers = mockSectionPage(MOCK_ANSWERS_SLUG, MOCK_ANSWERS_PATH);
const glossary = mockSectionPage(MOCK_GLOSSARY_SLUG, MOCK_GLOSSARY_PATH);
const catalog = mockSectionPage(MOCK_CATALOG_SLUG, MOCK_CATALOG_SLUG);
const sectionRoot = mockSectionPage(MOCK_SECTION_SLUG, MOCK_SECTION_SLUG);

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
    function mockChainNode(
      page: TRawSectionTreePage,
      children: TMaybeNull<TRawSectionTreePage[]> = null,
    ) {
      return {
        ...page,
        sectionNavigation: !isNull(children),
        sectionNavigationTitle: null,
        showPreviousNextLinks: true,
        showSubPagesInNavigation: false,
        children,
      };
    }

    const modulesSection = mockChainNode(sectionRoot, [faq, pricing]);
    const breadcrumbsToAnswers = [sectionRoot, faq, answers].map(toLink);

    function toSectionLink(page: TRawSectionTreePage, isCurrent: boolean) {
      return { ...toLink(page), isCurrent };
    }

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
        breadcrumbs: breadcrumbsToAnswers,
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

    describe('with sub-pages shown', () => {
      const groupedSection = {
        ...mockChainNode(sectionRoot, [
          { ...faq, children: [answers, glossary] },
          { ...pricing, children: [] },
        ]),
        showSubPagesInNavigation: true,
      };

      it('gives a page two levels down each top-level child with its pages', async () => {
        const navigation = await navigationFor({
          sectionChain: [
            mockChainNode(answers),
            mockChainNode(faq),
            groupedSection,
          ],
        });

        expect(navigation?.root).toEqual(toSectionLink(sectionRoot, false));
        expect(navigation?.pages).toEqual([
          {
            ...toSectionLink(faq, true),
            pages: [
              toSectionLink(answers, true),
              toSectionLink(glossary, false),
            ],
          },
          toSectionLink(pricing, false),
        ]);
        expect(navigation?.breadcrumbs).toEqual(breadcrumbsToAnswers);
      });

      it('gives a child with no pages of its own none', async () => {
        const navigation = await navigationFor({
          sectionChain: [groupedSection],
        });

        expect(navigation?.pages[1]).not.toHaveProperty('pages');
      });

      it.each([
        ['no path', { path: null }],
        ['no heading', { title: null }],
      ])('leaves out a sub-page with %s', async (_, broken) => {
        const navigation = await navigationFor({
          sectionChain: [
            {
              ...groupedSection,
              children: [
                { ...faq, children: [{ ...answers, ...broken }, glossary] },
              ],
            },
          ],
        });

        expect(navigation?.pages[0]?.pages).toEqual([
          toSectionLink(glossary, false),
        ]);
      });

      it("ignores a nested section's own navigation under the top page", async () => {
        const navigation = await navigationFor({
          sectionChain: [
            mockChainNode(answers),
            mockChainNode(faq, [glossary, answers]),
            groupedSection,
          ],
        });

        expect(navigation?.root.path).toBe(MOCK_SECTION_SLUG);
        expect(navigation?.parentSection).toBeUndefined();
      });
    });

    it('gives no page its sub-pages while the top page has the switch off', async () => {
      const navigation = await navigationFor({
        sectionChain: [
          mockChainNode(faq),
          mockChainNode(sectionRoot, [{ ...faq, children: [answers] }]),
        ],
      });

      expect(navigation?.pages[0]).not.toHaveProperty('pages');
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

  describe('adjacent pages', () => {
    function mockSection(
      overrides: Partial<TRawLandingPage['sectionChain'][number]> = {},
    ) {
      return {
        ...sectionRoot,
        sectionNavigation: true,
        sectionNavigationTitle: null,
        showPreviousNextLinks: true,
        showSubPagesInNavigation: false,
        children: [{ ...faq, children: [answers, glossary] }, pricing],
        ...overrides,
      };
    }

    function mockAncestor(page: TRawSectionTreePage) {
      return {
        ...page,
        sectionNavigation: false,
        sectionNavigationTitle: null,
        showPreviousNextLinks: true,
        showSubPagesInNavigation: false,
        children: null,
      };
    }

    async function adjacentPagesFor(
      overrides: Parameters<typeof mockRawLandingPage>[0],
    ) {
      const page = await loadPage(overrides, MOCK_SECTION_SLUG);

      return page.adjacentPages;
    }

    it.each([
      ['a nested page', answers, faq, glossary, [faq]],
      ["a nested section's last page", glossary, answers, pricing, [faq]],
      ['a top-level page', pricing, glossary, undefined, []],
      ['the first page beneath the top page', faq, undefined, answers, []],
    ])(
      'returns the neighbours of %s in the side navigation order',
      async (_, current, previous, next, ancestors) => {
        const sectionChain = [
          mockAncestor(current),
          ...ancestors.map(mockAncestor),
          mockSection(),
        ];

        expect(await adjacentPagesFor({ sectionChain })).toEqual({
          previous: previous && toLink(previous),
          next: next && toLink(next),
        });
      },
    );

    const nestedSection = {
      ...mockAncestor(faq),
      sectionNavigation: true,
      showPreviousNextLinks: false,
      children: [answers, glossary],
    };

    it.each([
      [
        'the last page of a nested section',
        [mockAncestor(glossary), nestedSection],
        answers,
        pricing,
      ],
      ['the root of a nested section', [nestedSection], undefined, answers],
    ])(
      "follows the top page's side navigation on %s while it shows sub-pages",
      async (_, chainBelowTop, previous, next) => {
        expect(
          await adjacentPagesFor({
            sectionChain: [
              ...chainBelowTop,
              mockSection({ showSubPagesInNavigation: true }),
            ],
          }),
        ).toEqual({
          previous: previous && toLink(previous),
          next: toLink(next),
        });
      },
    );

    it('skips a neighbour that has no path for the next one that has', async () => {
      const adjacentPages = await adjacentPagesFor({
        sectionChain: [
          mockAncestor(pricing),
          mockSection({
            children: [faq, { ...answers, path: null }, pricing],
          }),
        ],
      });

      expect(adjacentPages?.previous).toEqual(toLink(faq));
    });

    it.each([
      [
        'the section root switches the links off',
        [mockAncestor(pricing), mockSection({ showPreviousNextLinks: false })],
        null,
      ],
      [
        'the page is not in a section',
        [mockAncestor(pricing), mockAncestor(sectionRoot)],
        null,
      ],
      [
        'the page hides its section navigation',
        [mockAncestor(pricing), mockSection()],
        false,
      ],
      ['the page is the section top page', [mockSection()], null],
      [
        'the section has no other page',
        [mockAncestor(pricing), mockSection({ children: [pricing] })],
        null,
      ],
    ])(
      'returns no neighbours when %s',
      async (_, sectionChain, showSectionNavigation) => {
        expect(
          await adjacentPagesFor({ sectionChain, showSectionNavigation }),
        ).toBeUndefined();
      },
    );
  });
});
