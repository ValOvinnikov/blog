import { queries, TENANT_STATUS } from '@blog/db';

import { getHostTenantSanityContext } from './get-host-tenant-sanity-context';
import { resolveTenantId } from './resolve-tenant-id';

const {
  headersMock,
  isProductionEnvironmentMock,
  getPlatformSanityContextMock,
} = vi.hoisted(() => ({
  headersMock: vi.fn(),
  isProductionEnvironmentMock: vi.fn(),
  getPlatformSanityContextMock: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: headersMock }));
vi.mock('./resolve-tenant-id', () => ({ resolveTenantId: vi.fn() }));
vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantSanityCredentials: vi.fn() } },
  TENANT_STATUS: {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
  },
}));
vi.mock('@blog/service', () => ({
  getPlatformSanityContext: getPlatformSanityContextMock,
}));
vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

const setHost = (host: string | null) => {
  headersMock.mockResolvedValue({ get: () => host });
};

const platformTenant = {
  projectId: 'platform-project',
  dataset: 'production',
  token: 'platform-token',
};

describe(getHostTenantSanityContext, () => {
  beforeEach(() => {
    headersMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    vi.mocked(resolveTenantId).mockReset();
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockReset();
    getPlatformSanityContextMock.mockReset();
    getPlatformSanityContextMock.mockReturnValue(platformTenant);
  });

  it('resolves the tenant Sanity credentials for a matched host', async () => {
    setHost('acme.example.com');
    vi.mocked(resolveTenantId).mockResolvedValue('tenant-1');
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
    expect(resolveTenantId).toHaveBeenCalledWith('acme.example.com');
  });

  it('resolves as unresolvable in production when the host matches no tenant', async () => {
    setHost('unknown.example.com');
    isProductionEnvironmentMock.mockReturnValue(true);
    vi.mocked(resolveTenantId).mockResolvedValue(undefined);

    await expect(getHostTenantSanityContext()).resolves.toEqual({
      isResolvable: false,
    });
    expect(queries.tenants.getTenantSanityCredentials).not.toHaveBeenCalled();
  });

  it('falls back to the platform Sanity context outside production when no host matches (sole-tenant fallback already applied by resolveTenantId)', async () => {
    setHost('unknown.example.com');
    isProductionEnvironmentMock.mockReturnValue(false);
    vi.mocked(resolveTenantId).mockResolvedValue(undefined);

    await expect(getHostTenantSanityContext()).resolves.toEqual({
      isResolvable: true,
      tenant: platformTenant,
    });
  });

  it('falls back to the platform Sanity context when the matched tenant has no credentials set', async () => {
    setHost('acme.example.com');
    vi.mocked(resolveTenantId).mockResolvedValue('tenant-1');
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockResolvedValue(
      undefined,
    );

    await expect(getHostTenantSanityContext()).resolves.toEqual({
      isResolvable: true,
      tenant: platformTenant,
    });
  });
});

describe('getHostTenantSanityContext memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the host lookup and credentials query when called more than once in the same render pass', async () => {
    // `resolveTenantId`/`queries`/`headers`/`isProductionEnvironment` are all
    // replaced module-wide by the `vi.mock()` calls above — pinned for the
    // whole file and unaffected by `resetModules()`, so only
    // `get-host-tenant-sanity-context.ts` itself (a plain, non-mocked
    // module) needs re-importing to pick up the mocked `react.cache`.
    setHost('acme.example.com');
    vi.mocked(resolveTenantId).mockReset();
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockReset();
    vi.mocked(resolveTenantId).mockResolvedValue('tenant-1');
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

    expect(resolveTenantId).toHaveBeenCalledTimes(1);
    expect(queries.tenants.getTenantSanityCredentials).toHaveBeenCalledTimes(1);
  });
});
