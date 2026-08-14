import { getSiteConfig } from './get-site-config';

const { listTenantsMock, getSiteConfigMock } = vi.hoisted(() => ({
  listTenantsMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { listTenants: listTenantsMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

// `unstable_cache` requires a Next.js request-scoped store this test
// doesn't set up — pass the wrapped function straight through instead.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const TENANT = { id: 'tenant-1', slug: 'acme' };
const SITE_CONFIG_ROW = {
  id: 'row-1',
  tenantId: TENANT.id,
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

describe(getSiteConfig, () => {
  beforeEach(() => {
    listTenantsMock.mockReset();
    getSiteConfigMock.mockReset();
  });

  it('resolves the sole tenant and returns its site_config row', async () => {
    listTenantsMock.mockResolvedValue([TENANT]);
    getSiteConfigMock.mockResolvedValue(SITE_CONFIG_ROW);

    const result = await getSiteConfig();

    expect(result).toEqual({ ok: true, data: SITE_CONFIG_ROW });
    expect(getSiteConfigMock).toHaveBeenCalledWith(TENANT.id);
  });

  it('returns ok:true with undefined data when no tenant row exists', async () => {
    listTenantsMock.mockResolvedValue([]);

    const result = await getSiteConfig();

    expect(result).toEqual({ ok: true, data: undefined });
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it('returns ok:false when the query rejects', async () => {
    listTenantsMock.mockRejectedValue(new Error('boom'));

    const result = await getSiteConfig();

    expect(result.ok).toBe(false);
  });
});
