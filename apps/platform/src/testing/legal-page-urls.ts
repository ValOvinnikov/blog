import { toLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';

import { MOCK_TENANT_ROOT_DOMAIN } from './tenants/tenant-identity';

export const MOCK_LEGAL_PAGE_URLS = toLegalPageUrls({
  marketingSiteUrl: undefined,
  rootDomain: MOCK_TENANT_ROOT_DOMAIN,
});
