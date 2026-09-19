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
import { makeTag } from '@web/testing/shared/tag/fixtures';

import { TagBreadcrumbs } from './tag-breadcrumbs';

const { getTagPageMock, getTenantBaseUrlMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
}));

vi.mock('@web/server/tag/get-tag-page', () => ({
  getTagPage: getTagPageMock,
}));

vi.mock('@web/server/tenant/get-tenant-base-url', () => ({
  getTenantBaseUrl: getTenantBaseUrlMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const tag = makeTag({ title: 'TypeScript', slug: 'typescript' });
const successData = { tag, modules: [], seo: {} };

const setup = customRenderAsync(TagBreadcrumbs, {
  slug: 'typescript',
  tenant: 'tenant-1',
});

describe(`<${TagBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getTagPageMock.mockReset();
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
  });

  testNotFoundWithoutLog({ pageLoaderMock: getTagPageMock, setup });
  testNotFoundOnFetchFailure({
    pageLoaderMock: getTagPageMock,
    setup,
    eventFragment: 'tag_breadcrumbs.fetch_failed',
  });
  testBreadcrumbsTrail({
    pageLoaderMock: getTagPageMock,
    setup,
    successData,
    linkSteps: [{ label: 'Home', href: '/' }],
    currentLabel: 'TypeScript',
  });
  testBreadcrumbsJsonLdSchema({
    pageLoaderMock: getTagPageMock,
    setup,
    successData,
    itemPath: '/tags/typescript',
  });
  testNoJsonLdWithoutBaseUrl({
    pageLoaderMock: getTagPageMock,
    setup,
    successData,
    getTenantBaseUrlMock,
  });
  testForwardsArgsToLoader({
    pageLoaderMock: getTagPageMock,
    setup,
    successData,
    description: 'forwards the slug and tenant to getTagPage',
    expectedArgs: ['typescript', 'tenant-1'],
  });
});
