import { getEffectiveSettingsFeatures } from './get-effective-settings-features';

const { listTenantsMock, getSettingsFeaturesMock, getSiteConfigMock } =
  vi.hoisted(() => ({
    listTenantsMock: vi.fn(),
    getSettingsFeaturesMock: vi.fn(),
    getSiteConfigMock: vi.fn(),
  }));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { listTenants: listTenantsMock },
    settingsFeatures: { getSettingsFeatures: getSettingsFeaturesMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

// `unstable_cache` requires a Next.js request-scoped store this test
// doesn't set up — pass the wrapped function straight through instead.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const TENANT = { id: 'tenant-1' };

describe(getEffectiveSettingsFeatures, () => {
  beforeEach(() => {
    listTenantsMock.mockReset();
    getSettingsFeaturesMock.mockReset();
    getSiteConfigMock.mockReset();
  });

  it('maps the settings_features row to capabilities when one exists', async () => {
    listTenantsMock.mockResolvedValue([TENANT]);
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
    expect(getSettingsFeaturesMock).toHaveBeenCalledWith(TENANT.id);
  });

  it("falls back to the tenant's current preset defaults when no settings_features row exists", async () => {
    listTenantsMock.mockResolvedValue([TENANT]);
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
    listTenantsMock.mockResolvedValue([TENANT]);
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

  it('returns ok:true with undefined data when no tenant row exists', async () => {
    listTenantsMock.mockResolvedValue([]);

    const result = await getEffectiveSettingsFeatures();

    expect(result).toEqual({ ok: true, data: undefined });
    expect(getSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('returns ok:false when a query rejects', async () => {
    listTenantsMock.mockRejectedValue(new Error('boom'));

    const result = await getEffectiveSettingsFeatures();

    expect(result.ok).toBe(false);
  });
});
