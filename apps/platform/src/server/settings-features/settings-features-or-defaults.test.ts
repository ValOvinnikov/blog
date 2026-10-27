import { PRESET_ID, PRESET_REGISTRY } from '@blog/config';
import { mockSettingsFeaturesValues } from '@platform/testing/settings-features/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { featureDefaultsToValues } from '@platform/utils/settings-features-fields/settings-features-fields';

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

const MOCK_SAVED_AT = new Date('2026-10-01T09:00:00.000Z');

describe(getSettingsFeaturesOrDefaults, () => {
  beforeEach(() => {
    getSettingsFeaturesAndPresetMock.mockReset();
  });

  it('returns the saved toggles and their save time', async () => {
    const saved = mockSettingsFeaturesValues({
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      consentBannerEnabled: true,
    });
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: saved,
      updatedAt: MOCK_SAVED_AT,
      preset: PRESET_ID.EDITORIAL,
    });

    const result = await getSettingsFeaturesOrDefaults(MOCK_TENANT_ID);

    expect(getSettingsFeaturesAndPresetMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
    expect(result).toEqual({ values: saved, savedAt: MOCK_SAVED_AT });
  });

  it.each([
    {
      scenario: 'the saved preset',
      preset: PRESET_ID.EDITORIAL,
      expectedPreset: PRESET_ID.EDITORIAL,
    },
    {
      scenario: 'the CONSOLE preset when none was saved',
      preset: undefined,
      expectedPreset: PRESET_ID.CONSOLE,
    },
  ])(
    'falls back to the featureDefaults of $scenario',
    async ({ preset, expectedPreset }) => {
      getSettingsFeaturesAndPresetMock.mockResolvedValue({
        features: undefined,
        preset,
      });

      const result = await getSettingsFeaturesOrDefaults(MOCK_TENANT_ID);

      expect(result).toEqual({
        values: featureDefaultsToValues(
          PRESET_REGISTRY[expectedPreset].featureDefaults,
        ),
        savedAt: undefined,
      });
    },
  );
});
