import { queries } from '@shinefold/db';

// Import this before the module under test: the fakes register when this file runs.
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

beforeEach(() => {
  getSiteConfigMock.mockReset();
});
