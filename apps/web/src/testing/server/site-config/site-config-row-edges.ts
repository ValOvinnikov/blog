import { queries } from '@shinefold/db';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';

// These fakes register when this file runs, so a test takes their handles from here, never from the faked modules.
vi.mock('@web/server/tenant/request-tenant/request-tenant');
vi.mock(
  '@web/server/settings-features/get-tenant-entitlements/get-tenant-entitlements',
);

vi.mock(
  '@shinefold/db',
  () => import('@web/testing/server/site-config/site-config-db'),
);

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

export const getSiteConfigMock = vi.mocked(queries.siteConfig.getSiteConfig);

export const getRequestTenantIdMock = vi.mocked(getRequestTenantId);
