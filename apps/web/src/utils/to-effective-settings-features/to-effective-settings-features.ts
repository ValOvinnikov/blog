import {
  CAPABILITY,
  PRESET_REGISTRY,
  type TCapability,
  type TMaybeUndefined,
  type TPresetId,
} from '@blog/config';

type TSettingsFeaturesRow = {
  commentsEnabled: boolean;
  ratingsEnabled: boolean;
  bookmarksEnabled: boolean;
  newsletterEnabled: boolean;
  analyticsEnabled: boolean;
  consentBannerEnabled: boolean;
  contactFormEnabled: boolean;
};

/** `preset` is the tenant's current `site_config.preset`, not a value cached at provisioning time. */
export const toEffectiveSettingsFeatures = (
  row: TMaybeUndefined<TSettingsFeaturesRow>,
  preset: TPresetId,
): Record<TCapability, boolean> => {
  if (!row) return PRESET_REGISTRY[preset].featureDefaults;

  return {
    [CAPABILITY.COMMENTS]: row.commentsEnabled,
    [CAPABILITY.RATINGS]: row.ratingsEnabled,
    [CAPABILITY.BOOKMARKS]: row.bookmarksEnabled,
    [CAPABILITY.NEWSLETTER]: row.newsletterEnabled,
    [CAPABILITY.ANALYTICS]: row.analyticsEnabled,
    [CAPABILITY.CONSENT_BANNER]: row.consentBannerEnabled,
    [CAPABILITY.CONTACT_FORM]: row.contactFormEnabled,
  };
};
