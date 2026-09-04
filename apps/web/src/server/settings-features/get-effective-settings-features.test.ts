import { getEffectiveSettingsFeatures } from './get-effective-settings-features';

const { getRequestTenantIdMock, getSettingsFeaturesMock, getSiteConfigMock } =
  vi.hoisted(() => ({
    getRequestTenantIdMock: vi.fn(),
    getSettingsFeaturesMock: vi.fn(),
    getSiteConfigMock: vi.fn(),
  }));

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: getRequestTenantIdMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    settingsFeatures: { getSettingsFeatures: getSettingsFeaturesMock },
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

describe(getEffectiveSettingsFeatures, () => {
  beforeEach(() => {
    getRequestTenantIdMock.mockReset();
    getSettingsFeaturesMock.mockReset();
    getSiteConfigMock.mockReset();
  });

  it('maps the settings_features row to capabilities when one exists', async () => {
    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    getSettingsFeaturesMock.mockResolvedValue({
      commentsEnabled: false,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      analyticsEnabled: false,
    });
    getSiteConfigMock.mockResolvedValue({ preset: 'EDITORIAL' });

    const result = await getEffectiveSettingsFeatures();

    expect(result).toEqual({
      ok: true,
      data: {
        COMMENTS: false,
        RATINGS: true,
        BOOKMARKS: true,
        NEWSLETTER: true,
        ANALYTICS: false,
      },
    });
    expect(getSettingsFeaturesMock).toHaveBeenCalledWith(TENANT_A_ID);
  });

  it("falls back to the tenant's current preset defaults when no settings_features row exists", async () => {
    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue({ preset: 'EDITORIAL' });

    const result = await getEffectiveSettingsFeatures();

    expect(result).toEqual({
      ok: true,
      data: {
        COMMENTS: true,
        RATINGS: true,
        BOOKMARKS: true,
        NEWSLETTER: false,
        ANALYTICS: false,
      },
    });
  });

  it('falls back to the console preset when there is no site_config row either', async () => {
    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue(undefined);

    const result = await getEffectiveSettingsFeatures();

    expect(result).toEqual({
      ok: true,
      data: {
        COMMENTS: true,
        RATINGS: true,
        BOOKMARKS: true,
        NEWSLETTER: false,
        ANALYTICS: false,
      },
    });
  });

  it('returns ok:true with undefined data when the request has no resolvable tenant', async () => {
    getRequestTenantIdMock.mockResolvedValue(undefined);

    const result = await getEffectiveSettingsFeatures();

    expect(result).toEqual({ ok: true, data: undefined });
    expect(getSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('forwards an explicitly supplied tenant to getRequestTenantId', async () => {
    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue(undefined);

    await getEffectiveSettingsFeatures(TENANT_A_ID);

    expect(getRequestTenantIdMock).toHaveBeenCalledWith(TENANT_A_ID);
  });

  it('returns ok:false when a query rejects', async () => {
    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    getSettingsFeaturesMock.mockRejectedValue(new Error('boom'));

    const result = await getEffectiveSettingsFeatures();

    expect(result.ok).toBe(false);
  });

  it("resolves each request's own tenant's features rather than a shared one", async () => {
    getSettingsFeaturesMock.mockImplementation((tenantId: string) => ({
      commentsEnabled: tenantId === TENANT_A_ID,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: false,
      analyticsEnabled: false,
    }));
    getSiteConfigMock.mockResolvedValue({ preset: 'CONSOLE' });

    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    const resultA = await getEffectiveSettingsFeatures();

    getRequestTenantIdMock.mockResolvedValue(TENANT_B_ID);
    const resultB = await getEffectiveSettingsFeatures();

    expect(resultA.ok && resultA.data?.COMMENTS).toBe(true);
    expect(resultB.ok && resultB.data?.COMMENTS).toBe(false);
    expect(getSettingsFeaturesMock).toHaveBeenCalledWith(TENANT_A_ID);
    expect(getSettingsFeaturesMock).toHaveBeenCalledWith(TENANT_B_ID);
  });
});
