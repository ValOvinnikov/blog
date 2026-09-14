import { getTenantBaseUrl } from './get-tenant-base-url';
import { resolveRequestTenant } from './resolve-request-tenant';
import { UNRESOLVED_TENANT_PLACEHOLDER } from './unresolved-tenant-placeholder';

vi.mock('./resolve-request-tenant', () => ({
  resolveRequestTenant: vi.fn(),
}));

describe(getTenantBaseUrl, () => {
  beforeEach(() => {
    vi.mocked(resolveRequestTenant).mockReset();
  });

  it("builds an https URL from the resolved tenant's primaryDomain", async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: 'demo.valstack.dev',
    } as never);

    await expect(getTenantBaseUrl()).resolves.toBe('https://demo.valstack.dev');
  });

  it('falls back to NEXT_PUBLIC_SITE_URL when no tenant resolves', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { NEXT_PUBLIC_SITE_URL: 'https://blog-dev.valstack.dev' },
    }));
    vi.resetModules();
    const { getTenantBaseUrl: freshGetTenantBaseUrl } =
      await import('./get-tenant-base-url');
    const { resolveRequestTenant: freshResolveRequestTenant } =
      await import('./resolve-request-tenant');
    vi.mocked(freshResolveRequestTenant).mockResolvedValue(undefined);

    await expect(freshGetTenantBaseUrl()).resolves.toBe(
      'https://blog-dev.valstack.dev',
    );
  });

  it('falls back to NEXT_PUBLIC_SITE_URL when the resolved tenant has no primaryDomain', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { NEXT_PUBLIC_SITE_URL: 'https://blog-dev.valstack.dev' },
    }));
    vi.resetModules();
    const { getTenantBaseUrl: freshGetTenantBaseUrl } =
      await import('./get-tenant-base-url');
    const { resolveRequestTenant: freshResolveRequestTenant } =
      await import('./resolve-request-tenant');
    vi.mocked(freshResolveRequestTenant).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: '',
    } as never);

    await expect(freshGetTenantBaseUrl()).resolves.toBe(
      'https://blog-dev.valstack.dev',
    );
  });

  it('forwards an explicitly supplied tenant to resolveRequestTenant', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: 'demo.valstack.dev',
    } as never);

    await getTenantBaseUrl('tenant-1');

    expect(resolveRequestTenant).toHaveBeenCalledWith('tenant-1');
  });

  it('returns undefined when no tenant resolves and NEXT_PUBLIC_SITE_URL is unset', async () => {
    vi.doMock('@web/utils/env/env', () => ({ env: {} }));
    vi.resetModules();
    const { getTenantBaseUrl: freshGetTenantBaseUrl } =
      await import('./get-tenant-base-url');
    const { resolveRequestTenant: freshResolveRequestTenant } =
      await import('./resolve-request-tenant');
    vi.mocked(freshResolveRequestTenant).mockResolvedValue(undefined);

    await expect(freshGetTenantBaseUrl()).resolves.toBeUndefined();
  });
});

describe('getTenantBaseUrl with the real resolveRequestTenant chokepoint', () => {
  afterEach(() => {
    vi.doUnmock('./resolve-request-tenant');
    vi.doUnmock('@blog/db');
    vi.doUnmock('@web/utils/env/env');
    vi.resetModules();
  });

  it('falls back to NEXT_PUBLIC_SITE_URL for the unresolved-tenant placeholder segment, without ever querying tenant data', async () => {
    vi.doUnmock('./resolve-request-tenant');
    vi.doMock('@web/utils/env/env', () => ({
      env: { NEXT_PUBLIC_SITE_URL: 'https://blog-dev.valstack.dev' },
    }));
    vi.doMock('@blog/db', () => ({
      queries: {
        tenants: { getTenantById: vi.fn() },
        tenantDomains: { getTenantByDomain: vi.fn() },
      },
    }));
    vi.resetModules();

    const { getTenantBaseUrl: freshGetTenantBaseUrl } =
      await import('./get-tenant-base-url');
    const { queries } = await import('@blog/db');

    await expect(
      freshGetTenantBaseUrl(UNRESOLVED_TENANT_PLACEHOLDER),
    ).resolves.toBe('https://blog-dev.valstack.dev');

    expect(queries.tenants.getTenantById).not.toHaveBeenCalled();
    expect(queries.tenantDomains.getTenantByDomain).not.toHaveBeenCalled();
  });
});
