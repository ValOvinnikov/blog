import { faker } from '@faker-js/faker';
import { SITE_MESSAGES } from '@shinefold/config';
import { service, type TTopicDetailPage } from '@shinefold/service';
import { ARIA_CURRENT } from '@shinefold/ui/testing/aria';
import { errorResult, okResult } from '@shinefold/utils';
import { TOPIC_LOG } from '@web/constants/topic';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockPostListModuleData } from '@web/testing/modules/post-list/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_POST_LIST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';
import {
  MOCK_TENANT_NAME,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import {
  mockTopicDetailPage,
  mockTopicWithPostCount,
} from '@web/testing/shared/topic/fixtures';
import { logger } from '@web/utils/logger/logger';

import { TopicPage } from './topic-page';

faker.seed(6008);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

vi.mock('@shinefold/service', () => ({
  service: {
    pages: { topic: { v1: { getTopicPage: vi.fn() } } },
    entities: { topics: { v1: { getTopics: vi.fn() } } },
    modules: {
      postList: { v1: { getPostList: vi.fn() } },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const getTopicPageMock = vi.mocked(service.pages.topic.v1.getTopicPage);
const getTopicsMock = vi.mocked(service.entities.topics.v1.getTopics);
const getPostListMock = vi.mocked(service.modules.postList.v1.getPostList);

const MOCK_TOPIC_SLUG = faker.lorem.slug();
const MOCK_TOPIC = mockTopicWithPostCount({
  id: faker.string.uuid(),
  title: faker.lorem.word(),
  slug: MOCK_TOPIC_SLUG,
});
const MOCK_OTHER_TOPIC = mockTopicWithPostCount({
  id: faker.string.uuid(),
  title: faker.lorem.words(2),
  slug: `${MOCK_TOPIC_SLUG}-other`,
});

const resolveTopicPageWith = (overrides: Partial<TTopicDetailPage>) =>
  getTopicPageMock.mockResolvedValueOnce(
    okResult(mockTopicDetailPage({ topic: MOCK_TOPIC, ...overrides })),
  );

const setup = customRenderServerAsync(TopicPage, {
  slug: MOCK_TOPIC_SLUG,
});

describe(`<${TopicPage.name}/>`, () => {
  beforeEach(() => {
    getTopicPageMock.mockResolvedValue(
      okResult(mockTopicDetailPage({ topic: MOCK_TOPIC })),
    );
    getTopicsMock.mockResolvedValue(okResult([MOCK_TOPIC, MOCK_OTHER_TOPIC]));
  });

  describe('with the default topic', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the topic for the given slug with the tenant context', () => {
      expect(getTopicPageMock).toHaveBeenCalledWith(
        MOCK_TOPIC_SLUG,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: SITE_MESSAGES.breadcrumbs.ariaLabel,
      });
      const homeLink = within(breadcrumbs).getByRole('link', {
        name: MOCK_TENANT_NAME,
      });
      const currentCrumb = within(breadcrumbs).getByText(MOCK_TOPIC.title);
      const main = screen.getByRole('main');

      expect(homeLink).toBeVisible();
      expect(currentCrumb).toBeVisible();
      expect(main).not.toContainElement(breadcrumbs);
    });

    it('marks the current topic chip inside main', () => {
      const main = screen.getByRole('main');
      const chips = within(main).getByRole('navigation', {
        name: SITE_MESSAGES.topicChipList.ariaLabel,
      });
      const currentChip = within(chips).getByRole('link', {
        name: MOCK_TOPIC.title,
      });
      const otherChip = within(chips).getByRole('link', {
        name: MOCK_OTHER_TOPIC.title,
      });

      expect(currentChip).toHaveAttribute(ARIA_CURRENT, 'page');
      expect(otherChip).not.toHaveAttribute(ARIA_CURRENT);
    });
  });

  it('logs and throws to the error boundary when the fetch fails', async () => {
    getTopicPageMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toBe(MOCK_ERROR);

    expect(logger.error).toHaveBeenCalledWith(TOPIC_LOG.PAGE_FETCH_FAILED, {
      slug: MOCK_TOPIC_SLUG,
      error: MOCK_ERROR,
    });
  });

  it('names the topic in an empty post list', async () => {
    resolveTopicPageWith({
      modules: [{ id: MOCK_POST_LIST_ID, type: 'module_postList' }],
    });
    getPostListMock.mockResolvedValueOnce(okResult(mockPostListModuleData()));

    await setup();

    const emptyState = screen.getByText(
      SITE_MESSAGES.topicPage.empty.replace('{name}', MOCK_TOPIC.title),
    );

    expect(emptyState).toBeVisible();
  });
});
