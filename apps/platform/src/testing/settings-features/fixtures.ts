import type { TSettingsFeaturesAndPreset } from '@blog/db/queries/settings-features';
import type { TSettingsFeaturesValues } from '@platform/utils/settings-features-fields/settings-features-fields';

export const mockSettingsFeaturesValues = (
  overrides: Partial<TSettingsFeaturesValues> = {},
): TSettingsFeaturesValues => ({
  readerAccountsEnabled: false,
  commentsEnabled: false,
  ratingsEnabled: false,
  bookmarksEnabled: false,
  newsletterEnabled: false,
  analyticsEnabled: false,
  consentBannerEnabled: false,
  contactFormEnabled: false,
  ...overrides,
});

export const mockAllOnSettingsFeaturesValues = (): TSettingsFeaturesValues => ({
  readerAccountsEnabled: true,
  commentsEnabled: true,
  ratingsEnabled: true,
  bookmarksEnabled: true,
  newsletterEnabled: true,
  analyticsEnabled: true,
  consentBannerEnabled: true,
  contactFormEnabled: true,
});

export const mockUnsavedSettingsFeaturesAndPreset =
  (): TSettingsFeaturesAndPreset => ({
    features: undefined,
    updatedAt: undefined,
    preset: undefined,
  });
