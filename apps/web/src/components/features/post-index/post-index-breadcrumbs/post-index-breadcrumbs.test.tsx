import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { customRenderAsync } from '@web/testing/custom-render';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';
import { testStaticBreadcrumbsContract } from '@web/testing/shared/static-breadcrumbs-contract/static-breadcrumbs-contract';

import { PostIndexBreadcrumbs } from './post-index-breadcrumbs';

vi.mock('@web/server/tenant/get-tenant-base-url');

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const setup = customRenderAsync(PostIndexBreadcrumbs, { tenant: 'tenant-1' });

describe(`<${PostIndexBreadcrumbs.name}/>`, () => {
  testStaticBreadcrumbsContract({
    setup,
    getTenantBaseUrlMock: vi.mocked(getTenantBaseUrl),
    label: 'Blog',
    path: '/blog',
  });
});
