import { routes } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRenderAsync } from '@web/testing/custom-render';
import {
  testBreadcrumbsJsonLdSchema,
  testBreadcrumbsJsonLdTrail,
  testBreadcrumbsTrail,
  testForwardsArgsToLoader,
  testNoJsonLdWithoutBaseUrl,
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { mockSeo } from '@web/testing/shared/seo/fixtures';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
import { mockTopic } from '@web/testing/shared/topic/fixtures';

import { TopicBreadcrumbs } from './topic-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

const { getTopicPageMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/topic/get-topic-page/get-topic-page', () => ({
  getTopicPage: getTopicPageMock,
}));

faker.seed(5776);

const SITE_NAME = MOCK_SITE_SETTINGS.brand.name;
const MOCK_TOPIC_SLUG = faker.lorem.slug();
const MOCK_TOPIC = mockTopic({
  id: faker.string.uuid(),
  title: faker.lorem.words(2),
  slug: MOCK_TOPIC_SLUG,
});
const TOPIC_HREF = routes.topic(MOCK_TOPIC_SLUG);
const MOCK_PAGE = { topic: MOCK_TOPIC, modules: [], seo: mockSeo() };

const setup = customRenderAsync(TopicBreadcrumbs, {
  slug: MOCK_TOPIC_SLUG,
});

describe(`<${TopicBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getTopicPageMock.mockReset();
  });

  testNotFoundWithoutLog({ pageLoaderMock: getTopicPageMock, setup });
  testNotFoundOnFetchFailure({
    pageLoaderMock: getTopicPageMock,
    setup,
    eventFragment: 'topic_breadcrumbs.fetch_failed',
    logContext: { slug: MOCK_TOPIC_SLUG },
  });
  testBreadcrumbsTrail({
    pageLoaderMock: getTopicPageMock,
    setup,
    successData: MOCK_PAGE,
    linkSteps: [{ label: SITE_NAME, href: routes.home() }],
    currentLabel: MOCK_TOPIC.title,
  });
  testBreadcrumbsJsonLdSchema({
    pageLoaderMock: getTopicPageMock,
    setup,
    successData: MOCK_PAGE,
    itemPath: TOPIC_HREF,
  });
  testBreadcrumbsJsonLdTrail({
    pageLoaderMock: getTopicPageMock,
    setup,
    successData: MOCK_PAGE,
    expectedTrail: [
      { name: SITE_NAME, path: routes.home() },
      { name: MOCK_TOPIC.title, path: TOPIC_HREF },
    ],
  });
  testNoJsonLdWithoutBaseUrl({
    pageLoaderMock: getTopicPageMock,
    setup,
    successData: MOCK_PAGE,
  });
  testForwardsArgsToLoader({
    pageLoaderMock: getTopicPageMock,
    setup,
    successData: MOCK_PAGE,
    description: 'forwards the slug to getTopicPage',
    expectedArgs: [MOCK_TOPIC_SLUG],
  });
});
