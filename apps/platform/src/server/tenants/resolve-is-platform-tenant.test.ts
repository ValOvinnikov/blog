import { queries } from '@blog/db';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ROOT_DOMAIN,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import { resolveIsPlatformTenant } from './resolve-is-platform-tenant';

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', () => ({
  queries: { tenantDomains: { listTenantHosts: vi.fn() } },
}));

const listTenantHostsMock = vi.mocked(queries.tenantDomains.listTenantHosts);

const MOCK_TENANT = mockTenant();

describe(resolveIsPlatformTenant, () => {
  beforeEach(() => {
    mockedEnv.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    listTenantHostsMock.mockReset().mockResolvedValue([MOCK_TENANT_DOMAIN]);
  });

  it('is true for the tenant holding the root domain', async () => {
    listTenantHostsMock.mockResolvedValue([
      MOCK_TENANT_DOMAIN,
      MOCK_TENANT_ROOT_DOMAIN,
    ]);

    await expect(resolveIsPlatformTenant(MOCK_TENANT)).resolves.toBe(true);
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
