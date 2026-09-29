import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { customRenderAsync } from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import {
  testBreadcrumbsJsonLdSchema,
  testBreadcrumbsTrail,
  testForwardsArgsToLoader,
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';

import { PostBreadcrumbs } from './post-breadcrumbs';

const { getPostPageMock } = vi.hoisted(() => ({
  getPostPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/post/get-post-page', () => ({
  getPostPage: getPostPageMock,
}));

vi.mock('@web/server/tenant/get-tenant-base-url');

const getTenantBaseUrlMock = vi.mocked(getTenantBaseUrl);

const setup = customRenderAsync(PostBreadcrumbs, {
  slug: 'hello-world',
  tenant: 'tenant-1',
});

describe(`<${PostBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getPostPageMock.mockReset();
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
  });

  testNotFoundWithoutLog({ pageLoaderMock: getPostPageMock, setup });
  testNotFoundOnFetchFailure({ pageLoaderMock: getPostPageMock, setup });
  testBreadcrumbsTrail({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: mockPostDetail,
    linkSteps: [
      { label: 'Home', href: '/' },
      { label: 'Engineering', href: '/topics/engineering' },
    ],
    currentLabel: 'Hello World',
  });
  testBreadcrumbsJsonLdSchema({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: mockPostDetail,
    itemPath: '/topics/engineering',
  });
  testForwardsArgsToLoader({
    pageLoaderMock: getPostPageMock,
    setup,
    successData: mockPostDetail,
    description: 'forwards the slug and tenant to getPostPage',
    expectedArgs: ['hello-world', 'tenant-1'],
  });
});
