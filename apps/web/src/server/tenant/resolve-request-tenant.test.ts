import { queries } from '@blog/db';

import { resolveRequestTenant } from './resolve-request-tenant';
import { resolveTenant } from './resolve-tenant';

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock('next/headers', () => ({ headers: headersMock }));
vi.mock('./resolve-tenant', () => ({ resolveTenant: vi.fn() }));
vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantById: vi.fn(),
      getTenantSanityCredentials: vi.fn(),
      getTenantSanityWriteCredentials: vi.fn(),
    },
  },
}));

describe(resolveRequestTenant, () => {
  beforeEach(() => {
    headersMock.mockReset();
    vi.mocked(resolveTenant).mockReset();
    vi.mocked(queries.tenants.getTenantById).mockReset();
  });

  it('resolves from the Host header, ignoring any x-tenant-id header on the request', async () => {
    headersMock.mockResolvedValue(
      new Headers({ host: 'acme.example.com', 'x-tenant-id': 'tenant-1' }),
    );
    vi.mocked(resolveTenant).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: 'acme.example.com',
    } as never);

    await expect(resolveRequestTenant()).resolves.toEqual({
      id: 'tenant-1',
      primaryDomain: 'acme.example.com',
    });
    expect(resolveTenant).toHaveBeenCalledWith('acme.example.com');
  });

  it('does not let a spoofed x-tenant-id naming a different tenant than Host change which tenant is resolved', async () => {
    headersMock.mockResolvedValue(
      new Headers({
        host: 'victim.example.com',
        'x-tenant-id': 'attacker-tenant',
      }),
    );
    vi.mocked(resolveTenant).mockResolvedValue({
      id: 'victim-tenant',
      primaryDomain: 'victim.example.com',
    } as never);
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue({
      id: 'attacker-tenant',
      primaryDomain: 'attacker.example.com',
    } as never);

    await expect(resolveRequestTenant()).resolves.toEqual({
      id: 'victim-tenant',
      primaryDomain: 'victim.example.com',
    });
    expect(resolveTenant).toHaveBeenCalledWith('victim.example.com');
    expect(resolveTenant).not.toHaveBeenCalledWith(
      expect.stringContaining('attacker'),
    );
  });

  it('resolves undefined when Host-based resolution finds no tenant', async () => {
    headersMock.mockResolvedValue(new Headers());
    vi.mocked(resolveTenant).mockResolvedValue(undefined);

    await expect(resolveRequestTenant()).resolves.toBeUndefined();
  });
});

describe('resolveRequestTenant memoization', () => {
  beforeEach(() => {
    headersMock.mockReset();
    vi.mocked(resolveTenant).mockReset();
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockReset();
    vi.mocked(queries.tenants.getTenantSanityWriteCredentials).mockReset();
  });

  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the underlying lookup when called more than once in the same render pass', async () => {
    headersMock.mockResolvedValue(new Headers({ host: 'acme.example.com' }));
    vi.mocked(resolveTenant).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: 'acme.example.com',
    } as never);

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

    const { resolveRequestTenant: freshResolveRequestTenant } =
      await import('./resolve-request-tenant');

    await freshResolveRequestTenant();
    await freshResolveRequestTenant();

    expect(resolveTenant).toHaveBeenCalledTimes(1);
  });

  it('resolves the tenant exactly once when getTenantBaseUrl and getHostTenantSanityContext both ask for it in the same render pass', async () => {
    headersMock.mockResolvedValue(new Headers({ host: 'acme.example.com' }));
    vi.mocked(resolveTenant).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: 'acme.example.com',
    } as never);
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockResolvedValue({
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
    vi.doMock('@web/utils/is-production-environment', () => ({
      isProductionEnvironment: () => false,
    }));
    vi.resetModules();

    const { getTenantBaseUrl } = await import('./get-tenant-base-url');
    const { getHostTenantSanityContext } =
      await import('./get-host-tenant-sanity-context');

    await getTenantBaseUrl();
    await getHostTenantSanityContext();

    expect(resolveTenant).toHaveBeenCalledTimes(1);
  });

  it('resolves the tenant exactly once when getHostTenantSanityContext and getHostTenantSanityWriteContext both ask for it in the same render pass', async () => {
    headersMock.mockResolvedValue(new Headers({ host: 'acme.example.com' }));
    vi.mocked(resolveTenant).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: 'acme.example.com',
    } as never);
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockResolvedValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
    });
    vi.mocked(
      queries.tenants.getTenantSanityWriteCredentials,
    ).mockResolvedValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'write-tok',
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
    vi.doMock('@web/utils/is-production-environment', () => ({
      isProductionEnvironment: () => false,
    }));
    vi.resetModules();

    const { getHostTenantSanityContext } =
      await import('./get-host-tenant-sanity-context');
    const { getHostTenantSanityWriteContext } =
      await import('./get-host-tenant-sanity-write-context');

    await getHostTenantSanityContext();
    await getHostTenantSanityWriteContext();

    expect(resolveTenant).toHaveBeenCalledTimes(1);
  });
});
