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

describe('getHostTenantSanityContext memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the host lookup and credentials query when called more than once in the same render pass', async () => {
    vi.mocked(resolveRequestTenant).mockReset();
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockReset();
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

    vi.doMock('react', async (importOriginal) => {
      const actual = await importOriginal<typeof import('react')>();
      return {
        ...actual,
        cache: (fn: () => unknown) => {
          let called = false;
          let result: unknown;
          return () => {
            if (!called) {
              result = fn();
              called = true;
            }
            return result;
          };
        },
      };
    });
    vi.resetModules();

    const { getHostTenantSanityContext: freshGetHostTenantSanityContext } =
      await import('./get-host-tenant-sanity-context');

    await freshGetHostTenantSanityContext();
    await freshGetHostTenantSanityContext();

    expect(resolveRequestTenant).toHaveBeenCalledTimes(1);
    expect(queries.tenants.getTenantSanityCredentials).toHaveBeenCalledTimes(1);
  });
});
