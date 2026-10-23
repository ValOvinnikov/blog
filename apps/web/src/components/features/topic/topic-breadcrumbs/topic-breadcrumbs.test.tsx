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
import { makeTopic } from '@web/testing/shared/topic/fixtures';

import { TopicBreadcrumbs } from './topic-breadcrumbs';

const SITE_NAME = 'Northwind Journal';
const TOPIC_HREF = '/topics/news';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

const { getTopicPageMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/topic/get-topic-page/get-topic-page', () => ({
  getTopicPage: getTopicPageMock,
}));

const topic = makeTopic({ title: 'News', slug: 'news' });
const successData = { topic, modules: [], seo: mockSeo() };

const setup = customRenderAsync(TopicBreadcrumbs, {
  slug: 'news',
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
    currentLabel: 'News',
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
      { name: 'News', path: TOPIC_HREF },
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
    expectedArgs: ['news'],
  });
});
