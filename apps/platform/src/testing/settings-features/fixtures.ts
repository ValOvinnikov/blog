import {
  toAnalyticsDraft,
  type TFeaturesFormValues,
} from '@platform/utils/analytics-draft/analytics-draft';
import type { TSettingsFeaturesValues } from '@platform/utils/settings-features-fields/settings-features-fields';
import type { TSettingsFeaturesAndPreset } from '@shinefold/db/queries/settings-features';

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

export const mockFeaturesFormValues = (
  overrides: Partial<TFeaturesFormValues> = {},
): TFeaturesFormValues => ({
  ...mockSettingsFeaturesValues(),
  ...toAnalyticsDraft(undefined),
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
