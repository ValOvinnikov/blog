import { queries, TENANT_STATUS } from '@blog/db';

import { getHostTenantSanityContext } from './get-host-tenant-sanity-context';
import { resolveRequestTenant } from './resolve-request-tenant';

const { isProductionEnvironmentMock } = vi.hoisted(() => ({
  isProductionEnvironmentMock: vi.fn(),
}));

vi.mock('./resolve-request-tenant', () => ({
  resolveRequestTenant: vi.fn(),
}));
vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantSanityCredentials: vi.fn() } },
  TENANT_STATUS: {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
  },
}));
vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

describe(getHostTenantSanityContext, () => {
  beforeEach(() => {
    vi.mocked(resolveRequestTenant).mockReset();
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
  });

  it('resolves the tenant Sanity credentials for a resolved tenant', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: 'tenant-1',
    } as never);
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockResolvedValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
      provisioningStatus: null,
    });

    await expect(getHostTenantSanityContext()).resolves.toEqual({
      isResolvable: true,
      tenant: {
        projectId: 'proj',
        dataset: 'production',
        token: 'tok',
        status: TENANT_STATUS.ACTIVE,
        deprovisionedAt: null,
        provisioningStatus: null,
      },
    });
    expect(queries.tenants.getTenantSanityCredentials).toHaveBeenCalledWith(
      'tenant-1',
    );
  });

  it('resolves as unresolvable in production when no tenant resolves', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    vi.mocked(resolveRequestTenant).mockResolvedValue(undefined);

    await expect(getHostTenantSanityContext()).resolves.toEqual({
      isResolvable: false,
    });
    expect(queries.tenants.getTenantSanityCredentials).not.toHaveBeenCalled();
  });

  it('resolves with an undefined tenant outside production when no tenant resolves', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue(undefined);

    await expect(getHostTenantSanityContext()).resolves.toEqual({
      isResolvable: true,
      tenant: undefined,
    });
  });
});
