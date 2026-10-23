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

const SITE_NAME = MOCK_SITE_SETTINGS.brand.name;
const TOPIC_SLUG = 'news';
const TOPIC_TITLE = 'News';
const TOPIC_HREF = `/topics/${TOPIC_SLUG}`;

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

const { getTopicPageMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/topic/get-topic-page/get-topic-page', () => ({
  getTopicPage: getTopicPageMock,
}));

const topic = mockTopic({ title: TOPIC_TITLE, slug: TOPIC_SLUG });
const successData = { topic, modules: [], seo: mockSeo() };

const setup = customRenderAsync(TopicBreadcrumbs, {
  slug: TOPIC_SLUG,
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
  });
  testBreadcrumbsTrail({
    pageLoaderMock: getTopicPageMock,
    setup,
    successData,
    linkSteps: [{ label: SITE_NAME, href: '/' }],
    currentLabel: TOPIC_TITLE,
  });
  testBreadcrumbsJsonLdSchema({
    pageLoaderMock: getTopicPageMock,
    setup,
    successData,
    itemPath: TOPIC_HREF,
  });
  testBreadcrumbsJsonLdTrail({
    pageLoaderMock: getTopicPageMock,
    setup,
    successData,
    expectedTrail: [
      { name: SITE_NAME, path: '/' },
      { name: TOPIC_TITLE, path: TOPIC_HREF },
    ],
  });
  testNoJsonLdWithoutBaseUrl({
    pageLoaderMock: getTopicPageMock,
    setup,
    successData,
  });
  testForwardsArgsToLoader({
    pageLoaderMock: getTopicPageMock,
    setup,
    successData,
    description: 'forwards the slug to getTopicPage',
    expectedArgs: [TOPIC_SLUG],
  });
});
