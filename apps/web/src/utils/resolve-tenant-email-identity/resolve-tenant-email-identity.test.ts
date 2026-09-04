import { PRESET_ID, PRESET_REGISTRY, resolveTenantEmailBrand } from '@blog/config';
import { queries } from '@blog/db';
import { getSiteConfig } from '@web/server/site-config/get-site-config';

import { resolveTenantEmailIdentity } from './resolve-tenant-email-identity';

vi.mock('@web/server/site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantById: vi.fn() } },
}));

const TENANT_ID = 'tenant-1';

describe(resolveTenantEmailIdentity, () => {
  it("resolves the tenant's own brand and name on success", async () => {
    vi.mocked(getSiteConfig).mockResolvedValue({
      ok: true,
      data: { preset: PRESET_ID.CONSOLE, accentHue: 40 } as never,
    });
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue({
      name: 'Zeta Times',
    } as never);

    const identity = await resolveTenantEmailIdentity(TENANT_ID);

    expect(identity.brandName).toBe('Zeta Times');
    expect(identity.brand).toEqual(
      resolveTenantEmailBrand({ preset: PRESET_ID.CONSOLE, accentHue: 40 }),
    );
  });

  it('falls back to the default brand and logs when the site config fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(getSiteConfig).mockResolvedValue({
      ok: false,
      error: 'DB_NOT_FOUND',
    });
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue({
      name: 'Zeta Times',
    } as never);

    const identity = await resolveTenantEmailIdentity(TENANT_ID);

    expect(identity.brand).toEqual(
      resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
      }),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('tenant_email_identity.site_config_fetch_failed'),
    );
    errorSpy.mockRestore();
  });

  it('falls back to the default name when the tenant row cannot be found', async () => {
    vi.mocked(getSiteConfig).mockResolvedValue({ ok: true, data: undefined });
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(undefined);

    const identity = await resolveTenantEmailIdentity(TENANT_ID);

    expect(identity.brandName).toBe('Newsletter');
  });
});
