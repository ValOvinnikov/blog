import { queries, TENANT_STATUS } from '@blog/db';

import { getHostTenantSanityWriteContext } from './get-host-tenant-sanity-write-context';
import { resolveRequestTenant } from './resolve-request-tenant';

const { isProductionEnvironmentMock } = vi.hoisted(() => ({
  isProductionEnvironmentMock: vi.fn(),
}));

vi.mock('./resolve-request-tenant', () => ({
  resolveRequestTenant: vi.fn(),
}));
vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantSanityWriteCredentials: vi.fn() } },
  TENANT_STATUS: {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
  },
}));
vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

describe(getHostTenantSanityWriteContext, () => {
  beforeEach(() => {
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    vi.mocked(resolveRequestTenant).mockReset();
    vi.mocked(queries.tenants.getTenantSanityWriteCredentials).mockReset();
  });

  it('resolves the tenant Sanity write credentials for a resolved tenant', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: 'tenant-1',
    } as never);
    vi.mocked(
      queries.tenants.getTenantSanityWriteCredentials,
    ).mockResolvedValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
      provisioningStatus: null,
    });

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: true,
      tenant: {
        projectId: 'proj',
        dataset: 'production',
        token: 'tok',
        status: TENANT_STATUS.ACTIVE,
        deprovisionedAt: null,
        provisioningStatus: null,
      },
      tenantId: 'tenant-1',
    });
    expect(
      queries.tenants.getTenantSanityWriteCredentials,
    ).toHaveBeenCalledWith('tenant-1');
  });

  it('resolves as unresolvable in production when no tenant resolves', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    vi.mocked(resolveRequestTenant).mockResolvedValue(undefined);

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: false,
    });
    expect(
      queries.tenants.getTenantSanityWriteCredentials,
    ).not.toHaveBeenCalled();
  });

  it('resolves with an undefined tenant and tenantId outside production when no tenant resolves', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue(undefined);

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: true,
      tenant: undefined,
      tenantId: undefined,
    });
  });

  it('resolves with a defined tenantId but an undefined tenant when the resolved tenant has no usable write credentials', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: 'tenant-1',
    } as never);
    vi.mocked(
      queries.tenants.getTenantSanityWriteCredentials,
    ).mockResolvedValue(undefined);

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: true,
      tenant: undefined,
      tenantId: 'tenant-1',
    });
  });
});
