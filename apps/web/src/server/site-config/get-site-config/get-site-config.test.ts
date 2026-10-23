import {
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config/constants';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import {
  MOCK_DYNAMIC_SERVER_USAGE_ERROR,
  MOCK_ERROR,
} from '@web/testing/shared/error/fixtures';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

import { getSiteConfig } from './get-site-config';

const { getSiteConfigMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const getRequestTenantIdMock = vi.mocked(getRequestTenantId);

const SITE_CONFIG_ROW_A = {
  id: 'row-a',
  tenantId: MOCK_TENANT_ID,
  preset: PRESET_ID.CONSOLE,
  accentHue: 250,
  logoHue: undefined,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
  logoAssetUrl: undefined,
  faviconAssetUrl: undefined,
  voiceOverrides: {},
};

const SITE_CONFIG_ROW_B = {
  ...SITE_CONFIG_ROW_A,
  id: 'row-b',
  tenantId: MOCK_OTHER_TENANT_ID,
  preset: PRESET_ID.EDITORIAL,
  accentHue: 40,
};

describe(getSiteConfig, () => {
  beforeEach(() => {
    getRequestTenantIdMock.mockReset();
    getSiteConfigMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(MOCK_TENANT_ID);
  });

  it("resolves each request's own tenant's site_config row", async () => {
    getSiteConfigMock.mockImplementation((tenantId: string) =>
      tenantId === MOCK_TENANT_ID ? SITE_CONFIG_ROW_A : SITE_CONFIG_ROW_B,
    );

    getRequestTenantIdMock.mockResolvedValue(MOCK_TENANT_ID);
    const resultA = await getSiteConfig();

    getRequestTenantIdMock.mockResolvedValue(MOCK_OTHER_TENANT_ID);
    const resultB = await getSiteConfig();

    expect(resultA).toEqual({ ok: true, data: SITE_CONFIG_ROW_A });
    expect(resultB).toEqual({ ok: true, data: SITE_CONFIG_ROW_B });
    expect(getSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getSiteConfigMock).toHaveBeenCalledWith(MOCK_OTHER_TENANT_ID);
  });

  it('resolves no row when the request has no resolvable tenant', async () => {
    getRequestTenantIdMock.mockResolvedValue(undefined);

    const result = await getSiteConfig();

    expect(result).toEqual({ ok: true, data: undefined });
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it('reads the request tenant from the supplied tenant', async () => {
    getSiteConfigMock.mockResolvedValue(SITE_CONFIG_ROW_A);

    await getSiteConfig(MOCK_TENANT_ID);

    expect(getRequestTenantIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('returns ok:false when the query rejects', async () => {
    getSiteConfigMock.mockRejectedValue(MOCK_ERROR);

    const result = await getSiteConfig();

    expect(result.ok).toBe(false);
  });

  it("rethrows the header read's dynamic-rendering signal", async () => {
    getRequestTenantIdMock.mockRejectedValue(MOCK_DYNAMIC_SERVER_USAGE_ERROR);

    await expect(getSiteConfig()).rejects.toBe(MOCK_DYNAMIC_SERVER_USAGE_ERROR);
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });
});
