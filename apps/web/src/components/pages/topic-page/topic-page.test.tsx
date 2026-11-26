import { faker } from '@faker-js/faker';
import { SITE_MESSAGES } from '@shinefold/config';
import { service } from '@shinefold/service';
import { ARIA_CURRENT } from '@shinefold/ui/testing/aria';
import { okResult } from '@shinefold/utils';
import { TOPIC_LOG } from '@web/constants/topic';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { testLoadedPageContract } from '@web/testing/pages/loaded-page-contract/loaded-page-contract';
import { testNamesTermInEmptyPostList } from '@web/testing/pages/taxonomy-page/empty-post-list-contract';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import {
  mockTopicDetailPage,
  mockTopicWithPostCount,
} from '@web/testing/shared/topic/fixtures';

import { TopicPage } from './topic-page';

faker.seed(6008);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');

vi.mock('@web/server/site-config/get-bar-backgrounds/get-bar-backgrounds');
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

const MOCK_TOPIC_PAGE = mockTopicDetailPage({ topic: MOCK_TOPIC });

const setup = customRenderServerAsync(TopicPage, {
  slug: MOCK_TOPIC_SLUG,
});

describe(`<${TopicPage.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(service.entities.topics.v1.getTopics).mockResolvedValue(
      okResult([MOCK_TOPIC, MOCK_OTHER_TOPIC]),
    );
  });

  testLoadedPageContract({
    pageLoaderMock: getTopicPageMock,
    setup,
    successData: MOCK_TOPIC_PAGE,
    loaderArgs: [MOCK_TOPIC_SLUG, MOCK_TENANT_SANITY_CONTEXT],
    logEvent: TOPIC_LOG.PAGE_FETCH_FAILED,
    logContext: { slug: MOCK_TOPIC_SLUG },
    currentCrumb: MOCK_TOPIC.title,
  });

  it('marks the current topic chip inside main', async () => {
    getTopicPageMock.mockResolvedValue(okResult(MOCK_TOPIC_PAGE));

    await setup();

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

  testNamesTermInEmptyPostList({
    pageLoaderMock: getTopicPageMock,
    postListMock: vi.mocked(service.modules.postList.v1.getPostList),
    setup,
    successData: MOCK_TOPIC_PAGE,
    emptyState: SITE_MESSAGES.topicPage.empty.replace(
      '{name}',
      MOCK_TOPIC.title,
    ),
  });
});
