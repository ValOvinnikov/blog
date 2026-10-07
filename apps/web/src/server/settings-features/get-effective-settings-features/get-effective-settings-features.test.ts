import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';

import { getEffectiveSettingsFeatures } from './get-effective-settings-features';

const { getSettingsFeaturesMock, getSiteConfigMock } = vi.hoisted(() => ({
  getSettingsFeaturesMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@blog/db', () => ({
  queries: {
    settingsFeatures: { getSettingsFeatures: getSettingsFeaturesMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const getRequestTenantIdMock = vi.mocked(getRequestTenantId);

const TENANT_A_ID = 'tenant-a';
const TENANT_B_ID = 'tenant-b';

describe(getEffectiveSettingsFeatures, () => {
  beforeEach(() => {
    getRequestTenantIdMock.mockReset();
    getSettingsFeaturesMock.mockReset();
    getSiteConfigMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(TENANT_A_ID);
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue(undefined);
  });

  it('maps the settings_features row to capabilities when one exists', async () => {
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

  it("falls back to the tenant's preset defaults when no settings_features row exists", async () => {
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
        CONSENT_BANNER: false,
      },
    });
  });

  it('falls back to the console preset when there is no site_config row either', async () => {
    const result = await getEffectiveSettingsFeatures();

    expect(result).toEqual({
      ok: true,
      data: {
        COMMENTS: true,
        RATINGS: true,
        BOOKMARKS: true,
        NEWSLETTER: false,
        ANALYTICS: false,
        CONSENT_BANNER: false,
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
    await getEffectiveSettingsFeatures(TENANT_A_ID);

    expect(getRequestTenantIdMock).toHaveBeenCalledWith(TENANT_A_ID);
  });

  it('returns ok:false when a query rejects', async () => {
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

  it("rethrows the header read's dynamic-rendering signal instead of a fetch failure", async () => {
    const dynamicSignal = Object.assign(
      new Error(
        "Dynamic server usage: Route /[tenant]/[locale] couldn't be rendered statically because it used `headers`",
      ),
      { digest: 'DYNAMIC_SERVER_USAGE' },
    );
    getRequestTenantIdMock.mockRejectedValue(dynamicSignal);

    await expect(getEffectiveSettingsFeatures()).rejects.toBe(dynamicSignal);
    expect(getSettingsFeaturesMock).not.toHaveBeenCalled();
  });
});
