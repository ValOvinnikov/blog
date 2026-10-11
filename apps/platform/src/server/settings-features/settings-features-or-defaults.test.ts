import { PRESET_ID } from '@blog/config';

import { getSettingsFeaturesOrDefaults } from './settings-features-or-defaults';

const { getSettingsFeaturesAndPresetMock } = vi.hoisted(() => ({
  getSettingsFeaturesAndPresetMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    settingsFeatures: {
      getSettingsFeaturesAndPreset: getSettingsFeaturesAndPresetMock,
    },
  },
}));

describe(getSettingsFeaturesOrDefaults, () => {
  beforeEach(() => {
    getSettingsFeaturesAndPresetMock.mockReset();
  });

  it('returns the saved toggles when the tenant has saved Features', async () => {
    const saved = {
      commentsEnabled: false,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      analyticsEnabled: false,
      consentBannerEnabled: true,
    };
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: saved,
      preset: PRESET_ID.EDITORIAL,
    });

    const result = await getSettingsFeaturesOrDefaults('tenant-1');

    expect(getSettingsFeaturesAndPresetMock).toHaveBeenCalledWith('tenant-1');
    expect(result).toEqual(saved);
  });

  it("falls back to the saved preset's featureDefaults when Features was never saved", async () => {
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: undefined,
      preset: PRESET_ID.EDITORIAL,
    });

    const result = await getSettingsFeaturesOrDefaults('tenant-1');

    expect(result).toEqual({
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: false,
      analyticsEnabled: false,
      consentBannerEnabled: false,
    });
  });

  it('falls back to the CONSOLE preset featureDefaults when neither Features nor Look was saved', async () => {
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: undefined,
      preset: undefined,
    });

    const result = await getSettingsFeaturesOrDefaults('tenant-1');

    expect(result).toEqual({
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: false,
      analyticsEnabled: false,
      consentBannerEnabled: false,
    });
  });
});
