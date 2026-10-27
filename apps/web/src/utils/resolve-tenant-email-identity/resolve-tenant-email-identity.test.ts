import {
  ERROR_CODE,
  PRESET_ID,
  PRESET_REGISTRY,
  resolveTenantEmailBrand,
} from '@blog/config';
import { queries } from '@blog/db';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { resolveTenantEmailIdentity } from './resolve-tenant-email-identity';

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantById: vi.fn() } },
}));

faker.seed(6012);

const MOCK_TENANT_NAME = faker.company.name();
const MOCK_ACCENT_HUE = faker.number.int({ min: 0, max: 360 });

describe(resolveTenantEmailIdentity, () => {
  beforeEach(() => {
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue({
      name: MOCK_TENANT_NAME,
    } as never);
  });

  it("resolves the tenant's own brand and name", async () => {
    vi.mocked(getSiteConfig).mockResolvedValue(
      okResult({
        preset: PRESET_ID.CONSOLE,
        accentHue: MOCK_ACCENT_HUE,
      } as never),
    );

    const identity = await resolveTenantEmailIdentity(MOCK_TENANT_ID);

    expect(identity.brandName).toBe(MOCK_TENANT_NAME);
    expect(identity.brand).toEqual(
      resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: MOCK_ACCENT_HUE,
      }),
    );
  });

  it('falls back to the default brand and warns when site config fails', async () => {
    vi.mocked(getSiteConfig).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const identity = await resolveTenantEmailIdentity(MOCK_TENANT_ID);

    expect(identity.brand).toEqual(
      resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
      }),
    );
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'tenant_email_identity.site_config_fetch_failed',
      { tenantId: MOCK_TENANT_ID, error: ERROR_CODE.DB_NOT_FOUND },
    );
  });

  it('falls back to the default name and warns when the tenant is missing', async () => {
    vi.mocked(getSiteConfig).mockResolvedValue(okResult());
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(undefined);

    const identity = await resolveTenantEmailIdentity(MOCK_TENANT_ID);

    expect(identity.brandName).toBe('Newsletter');
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'tenant_email_identity.tenant_row_not_found',
      { tenantId: MOCK_TENANT_ID },
    );
  });
});
