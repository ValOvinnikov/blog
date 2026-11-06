import {
  ERROR_CODE,
  PRESET_ID,
  PRESET_REGISTRY,
  resolveTenantEmailBrand,
} from '@blog/config';
import { queries } from '@blog/db';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { TENANT_EMAIL_IDENTITY_LOG } from '@web/constants/tenant-email-identity';
import { getBrandName } from '@web/server/site-config/get-brand-name/get-brand-name';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { resolveTenantEmailIdentity } from './resolve-tenant-email-identity';

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');

vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantById: vi.fn() } },
}));

faker.seed(6012);

const MOCK_BRAND_NAME = faker.company.name();
const MOCK_ACCENT_HUE = faker.number.int({ min: 0, max: 360 });

describe(resolveTenantEmailIdentity, () => {
  beforeEach(() => {
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue({
      name: MOCK_TENANT_NAME,
    } as never);
    vi.mocked(getBrandName).mockResolvedValue(MOCK_BRAND_NAME);
  });

  it("resolves the tenant's own brand and brand name", async () => {
    vi.mocked(getSiteConfig).mockResolvedValue(
      okResult({
        preset: PRESET_ID.CONSOLE,
        accentHue: MOCK_ACCENT_HUE,
      } as never),
    );

    const identity = await resolveTenantEmailIdentity(MOCK_TENANT_ID);

    expect(identity.brandName).toBe(MOCK_BRAND_NAME);
    expect(identity.brand).toEqual(
      resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: MOCK_ACCENT_HUE,
      }),
    );
  });

  it("names the brand from the tenant's own row", async () => {
    vi.mocked(getSiteConfig).mockResolvedValue(okResult());

    await resolveTenantEmailIdentity(MOCK_TENANT_ID);

    expect(getBrandName).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      tenantName: MOCK_TENANT_NAME,
    });
  });

  it('falls back to the default brand when site config fails', async () => {
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
  });

  it('falls back to the default name and warns when the tenant is missing', async () => {
    vi.mocked(getSiteConfig).mockResolvedValue(okResult());
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(undefined);
    vi.mocked(getBrandName).mockResolvedValue(undefined);

    const identity = await resolveTenantEmailIdentity(MOCK_TENANT_ID);

    expect(identity.brandName).toBe('Newsletter');
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      TENANT_EMAIL_IDENTITY_LOG.TENANT_ROW_NOT_FOUND,
      { tenantId: MOCK_TENANT_ID },
    );
  });
});
