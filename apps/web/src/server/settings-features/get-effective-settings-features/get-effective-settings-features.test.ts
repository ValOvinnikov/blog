import { CAPABILITY, PRESET_REGISTRY } from '@blog/config';
import { PRESET_ID } from '@blog/config/constants';
import { queries } from '@blog/db';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { mockSettingsFeaturesRow } from '@web/testing/server/settings-features/fixtures';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import {
  MOCK_DYNAMIC_SERVER_USAGE_ERROR,
  MOCK_ERROR,
} from '@web/testing/shared/error/fixtures';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

import { getEffectiveSettingsFeatures } from './get-effective-settings-features';

faker.seed(6010);

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@blog/db', () => ({
  queries: {
    settingsFeatures: { getSettingsFeatures: vi.fn() },
    siteConfig: { getSiteConfig: vi.fn() },
  },
}));

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const getSettingsFeaturesMock = vi.mocked(
  queries.settingsFeatures.getSettingsFeatures,
);
const getSiteConfigMock = vi.mocked(queries.siteConfig.getSiteConfig);

describe(getEffectiveSettingsFeatures, () => {
  beforeEach(() => {
    getSettingsFeaturesMock.mockReset();
    getSiteConfigMock.mockReset();
  });

  it('maps the settings_features row to capabilities when one exists', async () => {
    getSettingsFeaturesMock.mockResolvedValue(
      mockSettingsFeaturesRow({
        commentsEnabled: false,
        analyticsEnabled: false,
        consentBannerEnabled: false,
        contactFormEnabled: false,
      }),
    );
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({ preset: PRESET_ID.EDITORIAL }),
    );

    const result = await getEffectiveSettingsFeatures();

    expect(result).toEqual(
      okResult({
        [CAPABILITY.COMMENTS]: false,
        [CAPABILITY.RATINGS]: true,
        [CAPABILITY.BOOKMARKS]: true,
        [CAPABILITY.NEWSLETTER]: true,
        [CAPABILITY.ANALYTICS]: false,
        [CAPABILITY.CONSENT_BANNER]: false,
        [CAPABILITY.CONTACT_FORM]: false,
      }),
    );
    expect(getSettingsFeaturesMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it.each([
    [
      "the tenant's preset defaults",
      mockSiteConfig({ preset: PRESET_ID.EDITORIAL }),
      PRESET_REGISTRY[PRESET_ID.EDITORIAL].featureDefaults,
    ],
    [
      'the console preset with no site_config row',
      undefined,
      PRESET_REGISTRY[PRESET_ID.CONSOLE].featureDefaults,
    ],
  ])(
    'falls back to %s when no settings_features row exists',
    async (_, siteConfig, featureDefaults) => {
      getSettingsFeaturesMock.mockResolvedValue(undefined);
      getSiteConfigMock.mockResolvedValue(siteConfig);

      const result = await getEffectiveSettingsFeatures();

      expect(result).toEqual(okResult(featureDefaults));
    },
  );

  it('resolves no features when the request has no resolvable tenant', async () => {
    vi.mocked(getRequestTenantId).mockResolvedValueOnce(undefined);

    const result = await getEffectiveSettingsFeatures();

    expect(result).toEqual(okResult());
    expect(getSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('reads the request tenant from the supplied tenant', async () => {
    await getEffectiveSettingsFeatures(MOCK_TENANT_ID);

    expect(getRequestTenantId).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('returns the failure when a query rejects', async () => {
    getSettingsFeaturesMock.mockRejectedValueOnce(MOCK_ERROR);

    const result = await getEffectiveSettingsFeatures();

    expect(result).toEqual(errorResult(MOCK_ERROR));
  });

  it("resolves each request's own tenant's features", async () => {
    getSettingsFeaturesMock.mockImplementation(async (tenantId) =>
      mockSettingsFeaturesRow({
        tenantId,
        commentsEnabled: tenantId === MOCK_TENANT_ID,
      }),
    );
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({ preset: PRESET_ID.CONSOLE }),
    );
    vi.mocked(getRequestTenantId)
      .mockResolvedValueOnce(MOCK_TENANT_ID)
      .mockResolvedValueOnce(MOCK_OTHER_TENANT_ID);

    const resultA = await getEffectiveSettingsFeatures();
    const resultB = await getEffectiveSettingsFeatures();

    expect(resultA.ok && resultA.data?.[CAPABILITY.COMMENTS]).toBe(true);
    expect(resultB.ok && resultB.data?.[CAPABILITY.COMMENTS]).toBe(false);
    expect(getSettingsFeaturesMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getSettingsFeaturesMock).toHaveBeenCalledWith(MOCK_OTHER_TENANT_ID);
  });

  it("rethrows the header read's dynamic-rendering signal", async () => {
    vi.mocked(getRequestTenantId).mockRejectedValueOnce(
      MOCK_DYNAMIC_SERVER_USAGE_ERROR,
    );

    await expect(getEffectiveSettingsFeatures()).rejects.toBe(
      MOCK_DYNAMIC_SERVER_USAGE_ERROR,
    );
    expect(getSettingsFeaturesMock).not.toHaveBeenCalled();
  });
});
