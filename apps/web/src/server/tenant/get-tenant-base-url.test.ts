import { queries } from '@blog/db';

import { getTenantBaseUrl } from './get-tenant-base-url';
import { resolveTenantId } from './resolve-tenant-id';

const { headersMock } = vi.hoisted(() => ({
  headersMock: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: headersMock }));
vi.mock('./resolve-tenant-id', () => ({ resolveTenantId: vi.fn() }));
vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantById: vi.fn() } },
}));

const setHost = (host: string | null) => {
  headersMock.mockResolvedValue({ get: () => host });
};

describe(getTenantBaseUrl, () => {
  beforeEach(() => {
    headersMock.mockReset();
    vi.mocked(resolveTenantId).mockReset();
    vi.mocked(queries.tenants.getTenantById).mockReset();
  });

  it("builds an https URL from the resolved tenant's primaryDomain", async () => {
    setHost('demo.valstack.dev');
    vi.mocked(resolveTenantId).mockResolvedValue('tenant-1');
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: 'demo.valstack.dev',
    } as never);

    await expect(getTenantBaseUrl()).resolves.toBe('https://demo.valstack.dev');
    expect(resolveTenantId).toHaveBeenCalledWith('demo.valstack.dev');
    expect(queries.tenants.getTenantById).toHaveBeenCalledWith('tenant-1');
  });

  it('falls back to NEXT_PUBLIC_SITE_URL when no tenant resolves for the host', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { NEXT_PUBLIC_SITE_URL: 'https://blog-dev.valstack.dev' },
    }));
    vi.resetModules();
    const { getTenantBaseUrl: freshGetTenantBaseUrl } =
      await import('./get-tenant-base-url');
    setHost('unknown.example.com');
    vi.mocked(resolveTenantId).mockResolvedValue(undefined);

    await expect(freshGetTenantBaseUrl()).resolves.toBe(
      'https://blog-dev.valstack.dev',
    );
    expect(queries.tenants.getTenantById).not.toHaveBeenCalled();
  });

  it('falls back to NEXT_PUBLIC_SITE_URL when the resolved tenant has no primaryDomain', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { NEXT_PUBLIC_SITE_URL: 'https://blog-dev.valstack.dev' },
    }));
    vi.resetModules();
    const { getTenantBaseUrl: freshGetTenantBaseUrl } =
      await import('./get-tenant-base-url');
    setHost('acme.example.com');
    vi.mocked(resolveTenantId).mockResolvedValue('tenant-1');
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: '',
    } as never);

    await expect(freshGetTenantBaseUrl()).resolves.toBe(
      'https://blog-dev.valstack.dev',
    );
  });

  it('returns undefined when no tenant resolves and NEXT_PUBLIC_SITE_URL is unset', async () => {
    vi.doMock('@web/utils/env/env', () => ({ env: {} }));
    vi.resetModules();
    const { getTenantBaseUrl: freshGetTenantBaseUrl } =
      await import('./get-tenant-base-url');
    setHost(null);
    vi.mocked(resolveTenantId).mockResolvedValue(undefined);

    await expect(freshGetTenantBaseUrl()).resolves.toBeUndefined();
  });
});

describe('getTenantBaseUrl memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the host lookup and tenant query when called more than once in the same render pass', async () => {
    setHost('demo.valstack.dev');
    vi.mocked(resolveTenantId).mockReset();
    vi.mocked(queries.tenants.getTenantById).mockReset();
    vi.mocked(resolveTenantId).mockResolvedValue('tenant-1');
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: 'demo.valstack.dev',
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

    const { getTenantBaseUrl: freshGetTenantBaseUrl } =
      await import('./get-tenant-base-url');

    await freshGetTenantBaseUrl();
    await freshGetTenantBaseUrl();

    expect(resolveTenantId).toHaveBeenCalledTimes(1);
    expect(queries.tenants.getTenantById).toHaveBeenCalledTimes(1);
  });
});
