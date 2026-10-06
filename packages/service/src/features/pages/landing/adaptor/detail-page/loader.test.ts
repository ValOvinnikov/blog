import { getFaqQuestions } from '@blog/service/shared/adaptors/faq-questions/loader';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawFaqModuleQuestions } from '@blog/service/testing/modules/fixtures';
import { makeRawLandingPage } from '@blog/service/testing/pages/fixtures';
import {
  makeRawHeadingBlock,
  makeRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPage } from './loader';

vi.mock('@blog/service/shared/adaptors/faq-questions/loader', () => ({
  getFaqQuestions: vi.fn(),
}));

const mockFaqQuestions = vi.mocked(getFaqQuestions);

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getPage', () => {
  it('maps the thin page_landing document to module refs', async () => {
    mockRun.mockResolvedValueOnce(makeRawLandingPage());

    const page = await getPage(['about'], tenant);
    if (!page) throw new Error('expected a landing page');

    expect(page.path).toBe('about');
    expect(page.modules).toEqual([
      { id: 'content-1', type: 'module_content' },
      { id: 'cta-1', type: 'module_cta' },
    ]);
  });

  it('maps an authored page_landing.headingBlock through to the view model', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawLandingPage({
        headingBlock: makeRawHeadingBlock('About Us', {
          supportingText: 'Who we are',
        }),
      }),
    );

    const page = await getPage(['about'], tenant);
    if (!page) throw new Error('expected a landing page');

    expect(page.headingBlock.heading).toBe('About Us');
    expect(page.headingBlock.supportingText).toBe('Who we are');
  });

  it('leaves hero undefined when page_landing.hero is unset', async () => {
    mockRun.mockResolvedValueOnce(makeRawLandingPage({ hero: null }));

    const page = await getPage(['about'], tenant);
    if (!page) throw new Error('expected a landing page');

    expect(page.hero).toBeUndefined();
  });

  it('maps a set page_landing.hero to a hero slot', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawLandingPage({
        hero: { _id: 'hero-1', _type: 'module_heroBlog' },
      }),
    );

    const page = await getPage(['about'], tenant);
    if (!page) throw new Error('expected a landing page');

    expect(page.hero).toEqual({ id: 'hero-1', type: 'module_heroBlog' });
  });

  it('rejects when page_landing.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawLandingPage({
        hero: { _id: 'cta-1', _type: 'module_cta' as never },
      }),
    );

    await expect(getPage(['about'], tenant)).rejects.toThrow();
  });

  it('lets authored seo override the resolved defaults, with no fallback for an unauthored openGraph', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawLandingPage({
        seo: makeRawSeo({ metaTitle: 'About Us' }),
      }),
    );

    const page = await getPage(['about'], tenant);
    if (!page) throw new Error('expected a landing page');

    expect(page.seo.title).toBe('About Us');
    expect(page.seo.ogTitle).toBeUndefined();
  });

  it('builds the faqs from the FAQ modules, in page order, with one request', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawLandingPage({
        modules: [
          { _id: 'faq-b', _type: 'module_faq' },
          { _id: 'cta-1', _type: 'module_cta' },
          { _id: 'faq-a', _type: 'module_faq' },
        ],
      }),
    );
    mockFaqQuestions.mockResolvedValueOnce([makeRawFaqModuleQuestions()]);

    const page = await getPage(['about'], tenant);
    if (!page) throw new Error('expected a page');

    expect(mockFaqQuestions).toHaveBeenCalledExactlyOnceWith(
      ['faq-b', 'faq-a'],
      tenant,
    );
    expect(page.faqs).toEqual([
      {
        id: 'block-faq-1',
        question: 'How long does onboarding take?',
        answer: 'Most teams are live within a week.',
      },
    ]);
  });

  it('makes no FAQ-questions request when the page has no FAQ module', async () => {
    mockRun.mockResolvedValueOnce(makeRawLandingPage());

    const page = await getPage(['about'], tenant);
    if (!page) throw new Error('expected a page');

    expect(mockFaqQuestions).not.toHaveBeenCalled();
    expect(page.faqs).toEqual([]);
  });

  it('resolves undefined, rather than rejecting, when no page_landing matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const page = await getPage(['missing'], tenant);

    expect(page).toBeUndefined();
  });

  it('threads tenant context into the query and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawLandingPage());

    await getPage(['about'], tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:page_landing', 't:tenant-a:template_landing'],
        }),
      }),
    );
  });
  describe('section navigation', () => {
    const faq = { _id: 'faq', title: 'FAQ', path: 'modules/faq' };
    const pricing = {
      _id: 'pricing',
      title: 'Pricing',
      path: 'modules/pricing',
    };
    const answers = {
      _id: 'answers',
      title: 'Answers',
      path: 'modules/faq/answers',
    };
    const glossary = {
      _id: 'glossary',
      title: 'Glossary',
      path: 'modules/faq/glossary',
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
      return { ...page, sectionNavigation: children !== null, children };
    }

    const modulesSection = chainNode(
      { _id: 'modules', title: 'Modules', path: 'modules' },
      [faq, pricing],
    );

    async function navigationFor(
      overrides: Parameters<typeof makeRawLandingPage>[0],
    ) {
      mockRun.mockResolvedValueOnce(makeRawLandingPage(overrides));
      const page = await getPage(['modules'], tenant);
      if (!page) throw new Error('expected a landing page');

      return page.sectionNavigation;
    }

    it("returns the section's children in drag order and the breadcrumb chain", async () => {
      expect(
        await navigationFor({
          sectionChain: [chainNode(answers), chainNode(faq), modulesSection],
        }),
      ).toEqual({
        root: { title: 'Modules', path: 'modules', isCurrent: false },
        pages: [
          { title: 'FAQ', path: 'modules/faq', isCurrent: true },
          { title: 'Pricing', path: 'modules/pricing', isCurrent: false },
        ],
        breadcrumbs: [
          { title: 'Modules', path: 'modules' },
          { title: 'FAQ', path: 'modules/faq' },
          { title: 'Answers', path: 'modules/faq/answers' },
        ],
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
        path: 'modules/faq',
        isCurrent: false,
      });
      expect(navigation?.pages).toEqual([
        { title: 'Glossary', path: 'modules/faq/glossary', isCurrent: false },
        { title: 'Answers', path: 'modules/faq/answers', isCurrent: true },
      ]);
    });

    it('leaves out a child page that has no path', async () => {
      const navigation = await navigationFor({
        sectionChain: [
          chainNode({ _id: 'modules', title: 'Modules', path: 'modules' }, [
            faq,
            { ...pricing, path: null },
          ]),
        ],
      });

      expect(navigation?.pages.map(({ path }) => path)).toEqual([
        'modules/faq',
      ]);
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
            chainNode({ _id: 'modules', title: 'Modules', path: 'modules' }),
          ],
        }),
      ).toBeUndefined();
    });
  });
});
