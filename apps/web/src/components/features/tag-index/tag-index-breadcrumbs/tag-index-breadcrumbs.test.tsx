import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { customRenderAsync } from '@web/testing/custom-render';
import { testStaticBreadcrumbsContract } from '@web/testing/shared/static-breadcrumbs-contract/static-breadcrumbs-contract';

import { TagIndexBreadcrumbs } from './tag-index-breadcrumbs';

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/tenant/get-tenant-base-url');

const getTenantBaseUrlMock = vi.mocked(getTenantBaseUrl);

const setup = customRenderAsync(TagIndexBreadcrumbs, { tenant: 'tenant-1' });

describe(`<${TagIndexBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
  });

  testStaticBreadcrumbsContract({
    setup,
    getTenantBaseUrlMock,
    label: 'Tags',
    path: '/tags',
  });
});
