import { mockedEnv } from '@platform/testing/env/mocked-env';
import {
  MOCK_MARKETING_HOST,
  MOCK_MARKETING_SITE_URL,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ROOT_DOMAIN,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { queries } from '@shinefold/db';

import { resolveIsPlatformTenant } from './resolve-is-platform-tenant';

vi.mock('@platform/utils/env/env');

vi.mock('@shinefold/db', () => ({
  queries: { tenantDomains: { listTenantHosts: vi.fn() } },
}));

const listTenantHostsMock = vi.mocked(queries.tenantDomains.listTenantHosts);

const MOCK_TENANT = mockTenant();

describe(resolveIsPlatformTenant, () => {
  beforeEach(() => {
    mockedEnv.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    mockedEnv.MARKETING_SITE_URL = undefined;
    listTenantHostsMock.mockReset().mockResolvedValue([MOCK_TENANT_DOMAIN]);
  });

  it('is true for the tenant holding the root domain', async () => {
    listTenantHostsMock.mockResolvedValue([
      MOCK_TENANT_DOMAIN,
      MOCK_TENANT_ROOT_DOMAIN,
    ]);

    await expect(resolveIsPlatformTenant(MOCK_TENANT)).resolves.toBe(true);
  });

  it('is true for the tenant holding the marketing site host', async () => {
    mockedEnv.MARKETING_SITE_URL = MOCK_MARKETING_SITE_URL;
    listTenantHostsMock.mockResolvedValue([MOCK_MARKETING_HOST]);

    await expect(resolveIsPlatformTenant(MOCK_TENANT)).resolves.toBe(true);
  });

  it('is false for the marketing site host when no marketing site is configured', async () => {
    listTenantHostsMock.mockResolvedValue([MOCK_MARKETING_HOST]);

    await expect(resolveIsPlatformTenant(MOCK_TENANT)).resolves.toBe(false);
  });

  it('is false for a tenant holding only its own hosts', async () => {
    await expect(resolveIsPlatformTenant(MOCK_TENANT)).resolves.toBe(false);
  });

  it('is false without reading hosts when no root domain is configured', async () => {
    mockedEnv.TENANT_ROOT_DOMAIN = undefined;

    await expect(resolveIsPlatformTenant(MOCK_TENANT)).resolves.toBe(false);
    expect(listTenantHostsMock).not.toHaveBeenCalled();
  });
});
