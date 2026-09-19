import { customRenderAsync } from '@web/testing/custom-render';
import {
  testBreadcrumbsJsonLdSchema,
  testBreadcrumbsTrail,
  testForwardsArgsToLoader,
  testNoJsonLdWithoutBaseUrl,
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';
import { makeTopic } from '@web/testing/shared/topic/fixtures';

import { TopicBreadcrumbs } from './topic-breadcrumbs';

const { getTopicPageMock, getTenantBaseUrlMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
}));

vi.mock('@web/server/topic/get-topic-page', () => ({
  getTopicPage: getTopicPageMock,
}));

vi.mock('@web/server/tenant/get-tenant-base-url', () => ({
  getTenantBaseUrl: getTenantBaseUrlMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const topic = makeTopic({ title: 'News', slug: 'news' });
const successData = { topic, modules: [], seo: {} };

const setup = customRenderAsync(TopicBreadcrumbs, {
  slug: 'news',
  tenant: 'tenant-1',
});

describe(`<${TopicBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getTopicPageMock.mockReset();
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
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
    getTenantBaseUrlMock,
  });
  testForwardsArgsToLoader({
    pageLoaderMock: getTopicPageMock,
    setup,
    successData,
    description: 'forwards the slug and tenant to getTopicPage',
    expectedArgs: ['news', 'tenant-1'],
  });
});
