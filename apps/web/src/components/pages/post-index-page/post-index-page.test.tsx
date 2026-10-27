import { LOCALE_ISO_CODES, routes, SITE_MESSAGES } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import { mockIndexPage } from '@web/testing/pages/index-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_POST_LIST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { mockTopicWithPostCount } from '@web/testing/shared/topic/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound, redirect } from 'next/navigation';

import { PostIndexPage } from './post-index-page';

faker.seed(6008);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

vi.mock('@blog/service', () => ({
  service: {
    pages: { blog: { v1: { getIndexPage: vi.fn() } } },
    entities: { topics: { v1: { getTopics: vi.fn() } } },
    modules: {
      heroBlog: { v1: { getHeroBlog: vi.fn() } },
      postList: { v1: { getPostList: vi.fn() } },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const getIndexPageMock = vi.mocked(service.pages.blog.v1.getIndexPage);
const getTopicsMock = vi.mocked(service.entities.topics.v1.getTopics);
const getHeroBlogMock = vi.mocked(service.modules.heroBlog.v1.getHeroBlog);
const getPostListMock = vi.mocked(service.modules.postList.v1.getPostList);

const MOCK_HERO_ID = faker.string.uuid();
const MOCK_HERO_HEADING = faker.lorem.words(3);
const MOCK_PAGE_HEADING = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_INDEX_PAGE = mockIndexPage({
  headingBlock: mockHeadingBlock({
    heading: MOCK_PAGE_HEADING,
    supportingText: MOCK_SUPPORTING_TEXT,
  }),
});
const MOCK_TOPIC_SLUG = faker.lorem.slug();
const MOCK_TOPIC = mockTopicWithPostCount({
  title: faker.lorem.word(),
  slug: MOCK_TOPIC_SLUG,
});
const MOCK_PAGE_NUMBER = faker.number.int({ min: 2, max: 9 });

const setup = customRenderServerAsync(PostIndexPage, {
  page: 1,
});

describe(`<${PostIndexPage.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(getRequestContext).mockReset();
    getIndexPageMock.mockResolvedValue(okResult(MOCK_INDEX_PAGE));
    getTopicsMock.mockResolvedValue(okResult([MOCK_TOPIC]));
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
        name: MOCK_PAGE_HEADING,
      });
      const supportingText = within(main).getByText(MOCK_SUPPORTING_TEXT);

      expect(heading).toBeVisible();
      expect(supportingText).toBeVisible();
    });

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: SITE_MESSAGES.breadcrumbs.ariaLabel,
      });
      const homeLink = within(breadcrumbs).getByRole('link', {
        name: MOCK_SITE_SETTINGS.brand.name,
      });
      const currentCrumb = within(breadcrumbs).getByText(MOCK_PAGE_HEADING);
      const main = screen.getByRole('main');

      expect(homeLink).toBeVisible();
      expect(currentCrumb).toBeVisible();
      expect(main).not.toContainElement(breadcrumbs);
    });

    it('renders the tenant topic chips inside main', () => {
      const main = screen.getByRole('main');
      const chips = within(main).getByRole('navigation', {
        name: SITE_MESSAGES.topicChipList.ariaLabel,
      });
      const topicChip = within(chips).getByRole('link', {
        name: MOCK_TOPIC.title,
      });

      expect(topicChip).toHaveAttribute('href', routes.topic(MOCK_TOPIC_SLUG));
    });

    it('fetches the topics with the tenant context', () => {
      expect(getTopicsMock).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
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

  it('redirects to / when this language has no post index page', async () => {
    getIndexPageMock.mockResolvedValueOnce(okResult());
    vi.mocked(getRequestContext).mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('loads post lists for the current page with no archive scope', async () => {
    getIndexPageMock.mockResolvedValueOnce(
      okResult({
        ...mockIndexPage(),
        modules: [{ id: MOCK_POST_LIST_ID, type: 'module_postList' }],
      }),
    );
    getPostListMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup({ page: MOCK_PAGE_NUMBER })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(getPostListMock).toHaveBeenCalledWith(
      MOCK_POST_LIST_ID,
      MOCK_TENANT_SANITY_CONTEXT,
      MOCK_PAGE_NUMBER,
      undefined,
    );
  });

  it('renders the hero in place of the heading when one is set', async () => {
    getIndexPageMock.mockResolvedValueOnce(
      okResult({
        ...mockIndexPage(),
        hero: { id: MOCK_HERO_ID, type: 'module_heroBlog' },
      }),
    );
    getHeroBlogMock.mockResolvedValueOnce(
      okResult(mockHeroBlogData({ heading: MOCK_HERO_HEADING })),
    );

    await setup();

    const heroHeading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_HERO_HEADING,
    });
    const pageHeading = screen.queryByRole('heading', {
      level: 1,
      name: MOCK_PAGE_HEADING,
    });

    expect(heroHeading).toBeVisible();
    expect(pageHeading).not.toBeInTheDocument();
  });
});
