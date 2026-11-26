import { faker } from '@faker-js/faker';
import { routes, SITE_MESSAGES } from '@shinefold/config';
import { service } from '@shinefold/service';
import { errorResult, okResult } from '@shinefold/utils';
import { POST_INDEX_LOG } from '@web/constants/post-index';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockIndexPage } from '@web/testing/pages/index-page/fixtures';
import {
  testLoadedPageContract,
  testRedirectsMissingLanguagePage,
} from '@web/testing/pages/loaded-page-contract/loaded-page-contract';
import { testPageHeading } from '@web/testing/pages/page-heading-contract/page-heading-contract';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_POST_LIST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { mockTopicWithPostCount } from '@web/testing/shared/topic/fixtures';

import { PostIndexPage } from './post-index-page';

faker.seed(6008);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');

vi.mock('@web/server/site-config/get-bar-backgrounds/get-bar-backgrounds');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

vi.mock('@shinefold/service', () => ({
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

const setup = customRenderServerAsync(PostIndexPage, { page: 1 });

describe(`<${PostIndexPage.name}/>`, () => {
  beforeEach(() => {
    getTopicsMock.mockResolvedValue(okResult([MOCK_TOPIC]));
  });

  testLoadedPageContract({
    pageLoaderMock: getIndexPageMock,
    setup,
    successData: MOCK_INDEX_PAGE,
    loaderArgs: [MOCK_TENANT_SANITY_CONTEXT],
    logEvent: POST_INDEX_LOG.PAGE_FETCH_FAILED,
    currentCrumb: MOCK_PAGE_HEADING,
  });
  testRedirectsMissingLanguagePage({ pageLoaderMock: getIndexPageMock, setup });
  testPageHeading({
    renderPage: () => {
      getIndexPageMock.mockResolvedValue(okResult(MOCK_INDEX_PAGE));
      return setup();
    },
    renderPageWithHero: (hero) => {
      getIndexPageMock.mockResolvedValue(
        okResult({ ...MOCK_INDEX_PAGE, hero }),
      );
      return setup();
    },
    heroBlogMock: vi.mocked(service.modules.heroBlog.v1.getHeroBlog),
    heading: MOCK_PAGE_HEADING,
    supportingText: MOCK_SUPPORTING_TEXT,
  });

  describe('with the default index page', () => {
    beforeEach(async () => {
      getIndexPageMock.mockResolvedValue(okResult(MOCK_INDEX_PAGE));
      await setup();
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

  it('loads post lists for the current page with no archive scope', async () => {
    getIndexPageMock.mockResolvedValue(
      okResult({
        ...MOCK_INDEX_PAGE,
        modules: [{ id: MOCK_POST_LIST_ID, type: 'module_postList' }],
      }),
    );
    vi.mocked(service.modules.postList.v1.getPostList).mockResolvedValueOnce(
      errorResult(MOCK_ERROR),
    );

    await expect(setup({ page: MOCK_PAGE_NUMBER })).rejects.toBe(MOCK_ERROR);

    expect(service.modules.postList.v1.getPostList).toHaveBeenCalledWith(
      MOCK_POST_LIST_ID,
      MOCK_TENANT_SANITY_CONTEXT,
      MOCK_PAGE_NUMBER,
      undefined,
    );
  });
});
