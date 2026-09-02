import { queries } from '@blog/db';

import { getHostTenantSanityWriteContext } from './get-host-tenant-sanity-write-context';
import { resolveTenantId } from './resolve-tenant-id';

const { headersMock, isProductionEnvironmentMock } = vi.hoisted(() => ({
  headersMock: vi.fn(),
  isProductionEnvironmentMock: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: headersMock }));
vi.mock('./resolve-tenant-id', () => ({ resolveTenantId: vi.fn() }));
vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantSanityWriteCredentials: vi.fn() } },
}));
vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

const setHost = (host: string | null) => {
  headersMock.mockResolvedValue({ get: () => host });
};

describe(getHostTenantSanityWriteContext, () => {
  beforeEach(() => {
    headersMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    vi.mocked(resolveTenantId).mockReset();
    vi.mocked(queries.tenants.getTenantSanityWriteCredentials).mockReset();
  });

  it('resolves the tenant Sanity write credentials for a matched host', async () => {
    setHost('acme.example.com');
    vi.mocked(resolveTenantId).mockResolvedValue('tenant-1');
    vi.mocked(
      queries.tenants.getTenantSanityWriteCredentials,
    ).mockResolvedValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
    });

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: true,
      tenant: { projectId: 'proj', dataset: 'production', token: 'tok' },
      tenantId: 'tenant-1',
    });
    expect(resolveTenantId).toHaveBeenCalledWith('acme.example.com');
  });

  it('resolves as unresolvable in production when the host matches no tenant', async () => {
    setHost('unknown.example.com');
    isProductionEnvironmentMock.mockReturnValue(true);
    vi.mocked(resolveTenantId).mockResolvedValue(undefined);

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: false,
    });
    expect(
      queries.tenants.getTenantSanityWriteCredentials,
    ).not.toHaveBeenCalled();
  });

  it('resolves with an undefined tenant and tenantId outside production when no host matches (sole-tenant fallback already applied by resolveTenantId)', async () => {
    setHost('unknown.example.com');
    isProductionEnvironmentMock.mockReturnValue(false);
    vi.mocked(resolveTenantId).mockResolvedValue(undefined);

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: true,
      tenant: undefined,
      tenantId: undefined,
    });
  });

  it('resolves with a defined tenantId but an undefined tenant when the resolved tenant has no usable write credentials', async () => {
    setHost('acme.example.com');
    vi.mocked(resolveTenantId).mockResolvedValue('tenant-1');
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

describe('getHostTenantSanityWriteContext memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the host lookup and credentials query when called more than once in the same render pass', async () => {
    setHost('acme.example.com');
    vi.mocked(resolveTenantId).mockReset();
    vi.mocked(queries.tenants.getTenantSanityWriteCredentials).mockReset();
    vi.mocked(resolveTenantId).mockResolvedValue('tenant-1');
    vi.mocked(
      queries.tenants.getTenantSanityWriteCredentials,
    ).mockResolvedValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
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

    const {
      getHostTenantSanityWriteContext: freshGetHostTenantSanityWriteContext,
    } = await import('./get-host-tenant-sanity-write-context');

    await freshGetHostTenantSanityWriteContext();
    await freshGetHostTenantSanityWriteContext();

    expect(resolveTenantId).toHaveBeenCalledTimes(1);
    expect(
      queries.tenants.getTenantSanityWriteCredentials,
    ).toHaveBeenCalledTimes(1);
  });
});
