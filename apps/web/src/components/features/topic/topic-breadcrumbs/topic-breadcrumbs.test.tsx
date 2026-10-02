import { customRenderAsync } from '@web/testing/custom-render';
import {
  testBreadcrumbsJsonLdSchema,
  testBreadcrumbsTrail,
  testForwardsArgsToLoader,
  testNoJsonLdWithoutBaseUrl,
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { makeTopic } from '@web/testing/shared/topic/fixtures';

import { TopicBreadcrumbs } from './topic-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

const { getTopicPageMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/topic/get-topic-page', () => ({
  getTopicPage: getTopicPageMock,
}));

const topic = makeTopic({ title: 'News', slug: 'news' });
const successData = { topic, modules: [], seo: {} };

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
    linkSteps: [{ label: 'Home', href: '/' }],
    currentLabel: 'News',
  });
  testBreadcrumbsJsonLdSchema({
    pageLoaderMock: getTopicPageMock,
    setup,
    successData,
    itemPath: '/topics/news',
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
