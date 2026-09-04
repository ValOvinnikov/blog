import { getTenantBaseUrl } from './get-tenant-base-url';
import { resolveRequestTenant } from './resolve-request-tenant';

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
