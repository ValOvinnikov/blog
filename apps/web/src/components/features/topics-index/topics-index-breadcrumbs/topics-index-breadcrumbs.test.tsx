import { customRenderAsync } from '@web/testing/custom-render';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';
import { testStaticBreadcrumbsContract } from '@web/testing/shared/static-breadcrumbs-contract/static-breadcrumbs-contract';

import { TopicsIndexBreadcrumbs } from './topics-index-breadcrumbs';

const { getTenantBaseUrlMock } = vi.hoisted(() => ({
  getTenantBaseUrlMock: vi.fn(),
}));

vi.mock('@web/server/tenant/get-tenant-base-url', () => ({
  getTenantBaseUrl: getTenantBaseUrlMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const setup = customRenderAsync(TopicsIndexBreadcrumbs, {
  tenant: 'tenant-1',
});

describe(`<${TopicsIndexBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
  });

  testStaticBreadcrumbsContract({
    setup,
    getTenantBaseUrlMock,
    label: 'Topics',
    path: '/topics',
  });
});
