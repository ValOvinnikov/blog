import { getSiteConfig } from './get-site-config';

const { getRequestTenantIdMock, getSiteConfigMock } = vi.hoisted(() => ({
  getRequestTenantIdMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: getRequestTenantIdMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

// `unstable_cache` requires a Next.js request-scoped store this test
// doesn't set up — pass the wrapped function straight through instead.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const TENANT_A_ID = 'tenant-a';
const TENANT_B_ID = 'tenant-b';

const SITE_CONFIG_ROW_A = {
  id: 'row-a',
  tenantId: TENANT_A_ID,
  preset: 'CONSOLE',
  accentHue: 250,
  logoHue: undefined,
  headingFont: 'SPACE_GROTESK',
  bodyFont: 'NEWSREADER',
  radiusScale: 'MD',
  density: 'DEFAULT',
  logoAssetUrl: undefined,
  faviconAssetUrl: undefined,
  voiceOverrides: {},
};

const SITE_CONFIG_ROW_B = {
  ...SITE_CONFIG_ROW_A,
  id: 'row-b',
  tenantId: TENANT_B_ID,
  preset: 'EDITORIAL',
  accentHue: 40,
};

describe(getSiteConfig, () => {
  beforeEach(() => {
    getRequestTenantIdMock.mockReset();
    getSiteConfigMock.mockReset();
  });

  it("resolves each request's own tenant's site_config row rather than a shared one", async () => {
    getSiteConfigMock.mockImplementation((tenantId: string) =>
      tenantId === TENANT_A_ID ? SITE_CONFIG_ROW_A : SITE_CONFIG_ROW_B,
    );

    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    const resultA = await getSiteConfig();

    getRequestTenantIdMock.mockResolvedValue(TENANT_B_ID);
    const resultB = await getSiteConfig();

    expect(resultA).toEqual({ ok: true, data: SITE_CONFIG_ROW_A });
    expect(resultB).toEqual({ ok: true, data: SITE_CONFIG_ROW_B });
    expect(getSiteConfigMock).toHaveBeenCalledWith(TENANT_A_ID);
    expect(getSiteConfigMock).toHaveBeenCalledWith(TENANT_B_ID);
  });

  it('returns ok:true with undefined data when the request has no resolvable tenant', async () => {
    getRequestTenantIdMock.mockResolvedValue(undefined);

    const result = await getSiteConfig();

    expect(result).toEqual({ ok: true, data: undefined });
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it('forwards an explicitly supplied tenant to getRequestTenantId', async () => {
    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    getSiteConfigMock.mockResolvedValue(SITE_CONFIG_ROW_A);

    await getSiteConfig(TENANT_A_ID);

    expect(getRequestTenantIdMock).toHaveBeenCalledWith(TENANT_A_ID);
  });

  it('returns ok:false when the query rejects', async () => {
    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    getSiteConfigMock.mockRejectedValue(new Error('boom'));

    const result = await getSiteConfig();

    expect(result.ok).toBe(false);
  });
});
