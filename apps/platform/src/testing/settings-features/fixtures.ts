import type { TSettingsFeaturesAndPreset } from '@blog/db/queries/settings-features';

export const mockUnsavedSettingsFeaturesAndPreset =
  (): TSettingsFeaturesAndPreset => ({
    features: undefined,
    updatedAt: undefined,
    preset: undefined,
  });
