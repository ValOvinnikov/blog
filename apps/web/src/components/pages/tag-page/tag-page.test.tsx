import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service, type TTagDetailPage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { JSON_LD_SCRIPT_TEST_ID } from '@web/constants/json-ld';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockCtaModuleData } from '@web/testing/modules/cta/fixtures';
import { mockHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import { mockPostListModuleData } from '@web/testing/modules/post-list/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { makeTagDetailPage } from '@web/testing/shared/tag/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { TagPage } from './tag-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

vi.mock('@blog/service', () => ({
  service: {
    pages: { tag: { v1: { getTagPage: vi.fn() } } },
    modules: {
      cta: { v1: { getCta: vi.fn() } },
      heroBlog: { v1: { getHeroBlog: vi.fn() } },
      postList: { v1: { getPostList: vi.fn() } },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const getTagPageMock = vi.mocked(service.pages.tag.v1.getTagPage);

const resolveTagPageWith = (overrides: Partial<TTagDetailPage>) =>
  getTagPageMock.mockResolvedValueOnce(okResult(makeTagDetailPage(overrides)));

const FAQ_PAGE_JSON_LD = '"@type":"FAQPage"';

const TAG_SLUG = 'typescript';

const setup = customRenderServerAsync(TagPage, {
  slug: TAG_SLUG,
});

const SUPPORTING_TEXT = 'Posts about TypeScript.';
const CTA_HEADING = 'Join the list';
const HERO_HEADING = 'All about TypeScript';

describe(`<${TagPage.name}/>`, () => {
  beforeEach(() => {
    getTagPageMock.mockResolvedValue(
      okResult(
        makeTagDetailPage({
          headingBlock: makeHeadingBlock({
            heading: 'TypeScript',
            supportingText: SUPPORTING_TEXT,
          }),
        }),
      ),
    );
  });

  describe('with the default tag', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the tag for the given slug with the tenant context', () => {
      expect(getTagPageMock).toHaveBeenCalledWith(
        TAG_SLUG,
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the tag heading and supporting text inside main', () => {
      const main = screen.getByRole('main');
      const heading = within(main).getByRole('heading', {
        level: 1,
        name: 'TypeScript',
      });
      const supportingText = within(main).getByText(SUPPORTING_TEXT);
      expect(heading).toBeVisible();
      expect(supportingText).toBeVisible();
    });

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: 'Breadcrumb',
      });
      const homeLink = within(breadcrumbs).getByRole('link', {
        name: 'Northwind Journal',
      });
      const currentCrumb = within(breadcrumbs).getByText('TypeScript');
      const main = screen.getByRole('main');
      expect(homeLink).toBeVisible();
      expect(currentCrumb).toBeVisible();
      expect(main).not.toContainElement(breadcrumbs);
    });

    it('renders no FAQPage JSON-LD when the page has no FAQ questions', () => {
      const scripts = screen.queryAllByTestId(JSON_LD_SCRIPT_TEST_ID);
      expect(
        scripts.some((script) =>
          script.textContent?.includes(FAQ_PAGE_JSON_LD),
        ),
      ).toBe(false);
    });
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getTagPageMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('tag_page.fetch_failed', {
      slug: TAG_SLUG,
      error: MOCK_ERROR,
    });
  });

  it('calls notFound() without logging when the tag does not exist', async () => {
    getTagPageMock.mockResolvedValueOnce(okResult());

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('renders the authored modules inside main', async () => {
    resolveTagPageWith({
      modules: [{ id: 'cta-1', type: 'module_cta' }],
    });
    vi.mocked(service.modules.cta.v1.getCta).mockResolvedValueOnce(
      okResult(
        mockCtaModuleData({
          headingBlock: makeHeadingBlock({ heading: CTA_HEADING }),
        }),
      ),
    );

    await setup();

    const main = screen.getByRole('main');
    const ctaRegion = within(main).getByRole('region', { name: CTA_HEADING });
    expect(ctaRegion).toBeVisible();
  });

  it('renders the hero in place of the tag heading when one is set', async () => {
    resolveTagPageWith({
      hero: { id: 'hero-1', type: 'module_heroBlog' },
    });
    vi.mocked(service.modules.heroBlog.v1.getHeroBlog).mockResolvedValueOnce(
      okResult(mockHeroBlogData({ heading: HERO_HEADING })),
    );

    await setup();

    const heroHeading = screen.getByRole('heading', {
      level: 1,
      name: HERO_HEADING,
    });
    const pageHeading = screen.queryByRole('heading', {
      level: 1,
      name: 'TypeScript',
    });
    expect(heroHeading).toBeVisible();
    expect(pageHeading).not.toBeInTheDocument();
  });

  it.each([
    { page: 3, expected: 3 },
    { page: undefined, expected: 1 },
  ])(
    'loads post lists for page $expected of the tag archive',
    async ({ page, expected }) => {
      resolveTagPageWith({
        modules: [{ id: 'list-1', type: 'module_postList' }],
      });
      vi.mocked(service.modules.postList.v1.getPostList).mockResolvedValueOnce(
        errorResult(MOCK_ERROR),
      );

      await expect(setup({ page })).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(service.modules.postList.v1.getPostList).toHaveBeenCalledWith(
        'list-1',
        DEFAULT_TENANT_SANITY_CONTEXT,
        expected,
        { termId: 'tag-1' },
      );
    },
  );

  it('names the tag in an empty post list', async () => {
    resolveTagPageWith({
      modules: [{ id: 'list-1', type: 'module_postList' }],
    });
    vi.mocked(service.modules.postList.v1.getPostList).mockResolvedValueOnce(
      okResult(mockPostListModuleData()),
    );

    await setup();

    const emptyState = screen.getByText('No posts tagged TypeScript yet.');
    expect(emptyState).toBeVisible();
  });

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    resolveTagPageWith({
      faqs: [
        {
          id: 'faq-1',
          question: 'Do you offer a free trial?',
          answer: 'Yes.',
        },
      ],
    });

    await setup();

    const scripts = screen.getAllByTestId(JSON_LD_SCRIPT_TEST_ID);
    expect(
      scripts.some((script) => script.textContent?.includes(FAQ_PAGE_JSON_LD)),
    ).toBe(true);
  });
});
