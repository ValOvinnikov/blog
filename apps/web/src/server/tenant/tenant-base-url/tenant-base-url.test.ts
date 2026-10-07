import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';

import { getTenantBaseUrl } from './tenant-base-url';

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
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

  describe('with NEXT_PUBLIC_SITE_URL set', () => {
    let freshGetTenantBaseUrl: typeof getTenantBaseUrl;
    let freshResolveRequestTenant: typeof resolveRequestTenant;

    beforeEach(async () => {
      vi.doMock('@web/utils/env/env', () => ({
        env: { NEXT_PUBLIC_SITE_URL: 'https://blog-dev.valstack.dev' },
      }));
      vi.resetModules();
      ({ getTenantBaseUrl: freshGetTenantBaseUrl } =
        await import('./tenant-base-url'));
      ({ resolveRequestTenant: freshResolveRequestTenant } =
        await import('@web/server/tenant/request-tenant/request-tenant'));
    });

    it('falls back to NEXT_PUBLIC_SITE_URL when no tenant resolves', async () => {
      vi.mocked(freshResolveRequestTenant).mockResolvedValue(undefined);

      await expect(freshGetTenantBaseUrl()).resolves.toBe(
        'https://blog-dev.valstack.dev',
      );
    });

    it('falls back to NEXT_PUBLIC_SITE_URL when the resolved tenant has no primaryDomain', async () => {
      vi.mocked(freshResolveRequestTenant).mockResolvedValue({
        id: 'tenant-1',
        primaryDomain: '',
      } as never);

      await expect(freshGetTenantBaseUrl()).resolves.toBe(
        'https://blog-dev.valstack.dev',
      );
    });
  });

  it('returns undefined when no tenant resolves and NEXT_PUBLIC_SITE_URL is unset', async () => {
    vi.doMock('@web/utils/env/env', () => ({ env: {} }));
    vi.resetModules();
    const { getTenantBaseUrl: freshGetTenantBaseUrl } =
      await import('./tenant-base-url');
    const { resolveRequestTenant: freshResolveRequestTenant } =
      await import('@web/server/tenant/request-tenant/request-tenant');
    vi.mocked(freshResolveRequestTenant).mockResolvedValue(undefined);

    await expect(freshGetTenantBaseUrl()).resolves.toBeUndefined();
  });
});
