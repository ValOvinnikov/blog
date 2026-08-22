import {
  CAPABILITY,
  PRESET_REGISTRY,
  type TCapability,
  type TPresetId,
} from '@blog/config';

type TSettingsFeaturesRow = {
  commentsEnabled: boolean;
  ratingsEnabled: boolean;
  bookmarksEnabled: boolean;
  newsletterEnabled: boolean;
  analyticsEnabled: boolean;
};

/**
 * Builds the tenant's effective per-capability toggle state from a
 * `settings_features` row (or `undefined`, when no row exists yet) —
 * falls back whole to the given preset's own `featureDefaults`, the
 * `settings_features` counterpart to `toThemeTokens`'s `site_config`
 * fallback. `preset` is the tenant's *current* `site_config.preset`, not a
 * value cached at provisioning time.
 */
export const toEffectiveSettingsFeatures = (
  row: TSettingsFeaturesRow | undefined,
  preset: TPresetId,
): Record<TCapability, boolean> => {
  if (!row) return PRESET_REGISTRY[preset].featureDefaults;

  return {
    [CAPABILITY.COMMENTS]: row.commentsEnabled,
    [CAPABILITY.RATINGS]: row.ratingsEnabled,
    [CAPABILITY.BOOKMARKS]: row.bookmarksEnabled,
    [CAPABILITY.NEWSLETTER]: row.newsletterEnabled,
    [CAPABILITY.ANALYTICS]: row.analyticsEnabled,
  };
};
