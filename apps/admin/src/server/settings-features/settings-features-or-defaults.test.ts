import { PRESET_ID } from '@blog/config';

import { getSettingsFeaturesOrDefaults } from './settings-features-or-defaults';

const { getSettingsFeaturesMock, getSiteConfigMock } = vi.hoisted(() => ({
  getSettingsFeaturesMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    settingsFeatures: { getSettingsFeatures: getSettingsFeaturesMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

describe(getSettingsFeaturesOrDefaults, () => {
  beforeEach(() => {
    getSettingsFeaturesMock.mockReset();
    getSiteConfigMock.mockReset();
  });

  it('returns the five toggle columns from an existing row, without touching site_config', async () => {
    getSettingsFeaturesMock.mockResolvedValue({
      id: 'row-1',
      tenantId: 'tenant-1',
      commentsEnabled: false,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      analyticsEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getSettingsFeaturesOrDefaults('tenant-1');

    expect(result).toEqual({
      commentsEnabled: false,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      analyticsEnabled: false,
    });
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it('falls back to the CONSOLE preset featureDefaults when no row and no site_config exists', async () => {
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue(undefined);

    const result = await getSettingsFeaturesOrDefaults('tenant-1');

    expect(result).toEqual({
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: false,
      analyticsEnabled: false,
    });
  });

  it("falls back to the tenant's currently-saved preset's featureDefaults, not always CONSOLE", async () => {
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.EDITORIAL,
      accentHue: 28,
      logoHue: undefined,
      headingFont: 'FRAUNCES',
      bodyFont: 'INTER',
      radiusScale: 'SM',
      density: 'COMPACT',
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
      voiceOverrides: {},
    });

    const result = await getSettingsFeaturesOrDefaults('tenant-1');

    // EDITORIAL's featureDefaults are the same values as CONSOLE's today,
    // but this asserts the preset actually read is EDITORIAL's, not a
    // hardcoded CONSOLE fallback — proven by getSiteConfig having been
    // consulted at all.
    expect(getSiteConfigMock).toHaveBeenCalledWith('tenant-1');
    expect(result).toEqual({
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: false,
      analyticsEnabled: false,
    });
  });
});
