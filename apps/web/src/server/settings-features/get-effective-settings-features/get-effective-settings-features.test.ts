import { PRESET_ID } from '@blog/config/constants';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import {
  MOCK_DYNAMIC_SERVER_USAGE_ERROR,
  MOCK_ERROR,
} from '@web/testing/shared/error/fixtures';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

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

describe(getEffectiveSettingsFeatures, () => {
  beforeEach(() => {
    getRequestTenantIdMock.mockReset();
    getSettingsFeaturesMock.mockReset();
    getSiteConfigMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(MOCK_TENANT_ID);
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
    getSiteConfigMock.mockResolvedValue({ preset: PRESET_ID.EDITORIAL });

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
    expect(getSettingsFeaturesMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it.each([
    ["the tenant's preset defaults", { preset: PRESET_ID.EDITORIAL }],
    ['the console preset with no site_config row', undefined],
  ])(
    'falls back to %s when no settings_features row exists',
    async (_, siteConfig) => {
      getSiteConfigMock.mockResolvedValue(siteConfig);

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
          CONTACT_FORM: true,
        },
      });
    },
  );

  it('resolves no features when the request has no resolvable tenant', async () => {
    getRequestTenantIdMock.mockResolvedValue(undefined);

    const result = await getEffectiveSettingsFeatures();

    expect(result).toEqual({ ok: true, data: undefined });
    expect(getSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('reads the request tenant from the supplied tenant', async () => {
    await getEffectiveSettingsFeatures(MOCK_TENANT_ID);

    expect(getRequestTenantIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('returns ok:false when a query rejects', async () => {
    getSettingsFeaturesMock.mockRejectedValue(MOCK_ERROR);

    const result = await getEffectiveSettingsFeatures();

    expect(result.ok).toBe(false);
  });

  it("resolves each request's own tenant's features", async () => {
    getSettingsFeaturesMock.mockImplementation((tenantId: string) => ({
      commentsEnabled: tenantId === MOCK_TENANT_ID,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: false,
      analyticsEnabled: false,
    }));
    getSiteConfigMock.mockResolvedValue({ preset: PRESET_ID.CONSOLE });

    getRequestTenantIdMock.mockResolvedValue(MOCK_TENANT_ID);
    const resultA = await getEffectiveSettingsFeatures();

    getRequestTenantIdMock.mockResolvedValue(MOCK_OTHER_TENANT_ID);
    const resultB = await getEffectiveSettingsFeatures();

    expect(resultA.ok && resultA.data?.COMMENTS).toBe(true);
    expect(resultB.ok && resultB.data?.COMMENTS).toBe(false);
    expect(getSettingsFeaturesMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getSettingsFeaturesMock).toHaveBeenCalledWith(MOCK_OTHER_TENANT_ID);
  });

  it("rethrows the header read's dynamic-rendering signal", async () => {
    getRequestTenantIdMock.mockRejectedValue(MOCK_DYNAMIC_SERVER_USAGE_ERROR);

    await expect(getEffectiveSettingsFeatures()).rejects.toBe(
      MOCK_DYNAMIC_SERVER_USAGE_ERROR,
    );
    expect(getSettingsFeaturesMock).not.toHaveBeenCalled();
  });
});
