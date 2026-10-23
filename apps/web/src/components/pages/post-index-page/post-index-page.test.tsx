import { LOCALE_ISO_CODES, CONTENT_ALIGNMENT } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service, type TBlogIndexPage } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import {
  MOCK_CTA_HEADING,
  mockCtaModuleData,
} from '@web/testing/modules/cta/fixtures';
import { mockHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import {
  MOCK_TENANT_SANITY_CONTEXT,
  MOCK_REQUEST_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { mockTopicWithPostCount } from '@web/testing/shared/topic/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound, redirect } from 'next/navigation';

import { PostIndexPage } from './post-index-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

vi.mock('@blog/service', () => ({
  service: {
    pages: { blog: { v1: { getIndexPage: vi.fn() } } },
    entities: { topics: { v1: { getTopics: vi.fn() } } },
    modules: {
      cta: { v1: { getCta: vi.fn() } },
      heroBlog: { v1: { getHeroBlog: vi.fn() } },
      postList: { v1: { getPostList: vi.fn() } },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const getIndexPageMock = vi.mocked(service.pages.blog.v1.getIndexPage);

const SUPPORTING_TEXT = 'Notes from the team.';
const HERO_HEADING = 'Everything we write';

const indexPage: TBlogIndexPage = {
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  headingBlock: mockHeadingBlock({
    heading: 'Blog',
    supportingText: SUPPORTING_TEXT,
  }),
  hero: undefined,
  modules: [],
  seo: mockSeo(),
  translations: [LOCALE_ISO_CODES.EN],
};

const resolveIndexPageWith = (overrides: Partial<TBlogIndexPage>) =>
  getIndexPageMock.mockResolvedValueOnce(
    okResult({ ...indexPage, ...overrides }),
  );

const setup = customRenderServerAsync(PostIndexPage, {
  page: 1,
});

describe(`<${PostIndexPage.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(getRequestContext).mockReset();
    getIndexPageMock.mockResolvedValue(okResult(indexPage));
    vi.mocked(service.entities.topics.v1.getTopics).mockResolvedValue(
      okResult([
        mockTopicWithPostCount({ title: 'Engineering', slug: 'engineering' }),
      ]),
    );
  });

  describe('with the default index page', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the index page with the tenant context', () => {
      expect(getIndexPageMock).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
    });

    it('renders the page heading and supporting text inside main', () => {
      const main = screen.getByRole('main');
      const heading = within(main).getByRole('heading', {
        level: 1,
        name: 'Blog',
      });
      const supportingText = within(main).getByText(SUPPORTING_TEXT);
      expect(heading).toBeVisible();
      expect(supportingText).toBeVisible();
      expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    });

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: 'Breadcrumb',
      });
      const homeLink = within(breadcrumbs).getByRole('link', {
        name: 'Northwind Journal',
      });
      const currentCrumb = within(breadcrumbs).getByText('Blog');
      const main = screen.getByRole('main');
      expect(homeLink).toBeVisible();
      expect(currentCrumb).toBeVisible();
      expect(main).not.toContainElement(breadcrumbs);
    });

    it('renders the tenant topic chips inside main', () => {
      const main = screen.getByRole('main');
      const topics = within(main).getByRole('navigation', { name: 'Topics' });
      const engineeringChip = within(topics).getByRole('link', {
        name: 'Engineering',
      });
      expect(engineeringChip).toHaveAttribute('href', '/topics/engineering');
      expect(service.entities.topics.v1.getTopics).toHaveBeenCalledWith(
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getIndexPageMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('post_index_page.fetch_failed', {
      error: MOCK_ERROR,
    });
  });

  describe('when there is no index page', () => {
    beforeEach(() => {
      getIndexPageMock.mockResolvedValueOnce(okResult());
    });

    it('calls notFound() without logging when there is no index page', async () => {
      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('redirects to / when this language has no post index page', async () => {
      vi.mocked(getRequestContext).mockResolvedValue({
        ...MOCK_REQUEST_CONTEXT,
        locale: LOCALE_ISO_CODES.NL,
        liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
      });

      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
      expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    });
  });

  it('renders the authored modules inside main', async () => {
    resolveIndexPageWith({
      modules: [{ id: 'cta-1', type: 'module_cta' }],
    });
    vi.mocked(service.modules.cta.v1.getCta).mockResolvedValueOnce(
      okResult(
        mockCtaModuleData({
          headingBlock: mockHeadingBlock({ heading: MOCK_CTA_HEADING }),
        }),
      ),
    );

    await setup();

    const main = screen.getByRole('main');
    const ctaRegion = within(main).getByRole('region', {
      name: MOCK_CTA_HEADING,
    });
    expect(ctaRegion).toBeVisible();
  });

  it('renders the hero in place of the page heading when one is set', async () => {
    resolveIndexPageWith({
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
      name: 'Blog',
    });
    expect(heroHeading).toBeVisible();
    expect(pageHeading).not.toBeInTheDocument();
  });

  it('loads post lists for the current page with no archive scope', async () => {
    resolveIndexPageWith({
      modules: [{ id: 'list-1', type: 'module_postList' }],
    });
    vi.mocked(service.modules.postList.v1.getPostList).mockResolvedValueOnce(
      errorResult(MOCK_ERROR),
    );

    await expect(setup({ page: 2 })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(service.modules.postList.v1.getPostList).toHaveBeenCalledWith(
      'list-1',
      MOCK_TENANT_SANITY_CONTEXT,
      2,
      undefined,
    );
  });
});
