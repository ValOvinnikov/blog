import {
  ERROR_CODE,
  PRESET_ID,
  PRESET_REGISTRY,
  resolveTenantEmailBrand,
} from '@blog/config';
import { queries } from '@blog/db';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { DEFAULT_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { resolveTenantEmailIdentity } from './resolve-tenant-email-identity';

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantById: vi.fn() } },
}));

const TENANT_NAME = 'Zeta Times';

describe(resolveTenantEmailIdentity, () => {
  beforeEach(() => {
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue({
      name: TENANT_NAME,
    } as never);
  });

  it("resolves the tenant's own brand and name on success", async () => {
    vi.mocked(getSiteConfig).mockResolvedValue({
      ok: true,
      data: { preset: PRESET_ID.CONSOLE, accentHue: 40 } as never,
    });

    const identity = await resolveTenantEmailIdentity(DEFAULT_TENANT_ID);

    expect(identity.brandName).toBe(TENANT_NAME);
    expect(identity.brand).toEqual(
      resolveTenantEmailBrand({ preset: PRESET_ID.CONSOLE, accentHue: 40 }),
    );
  });

  it('falls back to the default brand and logs when the site config fetch fails', async () => {
    vi.mocked(getSiteConfig).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    const identity = await resolveTenantEmailIdentity(DEFAULT_TENANT_ID);

    expect(identity.brand).toEqual(
      resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
      }),
    );
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'tenant_email_identity.site_config_fetch_failed',
      { tenantId: DEFAULT_TENANT_ID, error: ERROR_CODE.DB_NOT_FOUND },
    );
  });

  it('falls back to the default name and logs when the tenant row cannot be found', async () => {
    vi.mocked(getSiteConfig).mockResolvedValue({ ok: true, data: undefined });
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(undefined);

    const identity = await resolveTenantEmailIdentity(DEFAULT_TENANT_ID);

    expect(identity.brandName).toBe('Newsletter');
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'tenant_email_identity.tenant_row_not_found',
      { tenantId: DEFAULT_TENANT_ID },
    );
  });
});
