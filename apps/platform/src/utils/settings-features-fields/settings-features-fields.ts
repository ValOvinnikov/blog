import { CAPABILITY, type TCapability } from '@blog/config';

export type TSettingsFeaturesValues = {
  commentsEnabled: boolean;
  ratingsEnabled: boolean;
  bookmarksEnabled: boolean;
  newsletterEnabled: boolean;
  analyticsEnabled: boolean;
  consentBannerEnabled: boolean;
};

export type TCapabilityToggle = {
  capability: TCapability;
  field: keyof TSettingsFeaturesValues;
  isComingSoon?: boolean;
};

/**
 * The single source of truth mapping each `TCapability` to its
 * `settings_features` column — the Features tab renders one row per entry,
 * and the Server Action walks the same list to re-check plan entitlement
 * per capability before writing anything.
 */
export const CAPABILITY_TOGGLES: TCapabilityToggle[] = [
  {
    capability: CAPABILITY.COMMENTS,
    field: 'commentsEnabled',
    isComingSoon: true,
  },
  {
    capability: CAPABILITY.RATINGS,
    field: 'ratingsEnabled',
    isComingSoon: true,
  },
  { capability: CAPABILITY.BOOKMARKS, field: 'bookmarksEnabled' },
  {
    capability: CAPABILITY.NEWSLETTER,
    field: 'newsletterEnabled',
    isComingSoon: true,
  },
  { capability: CAPABILITY.ANALYTICS, field: 'analyticsEnabled' },
  { capability: CAPABILITY.CONSENT_BANNER, field: 'consentBannerEnabled' },
];

/** Converts a `PRESET_REGISTRY[preset].featureDefaults` map into the column-keyed view-model shape. */
export const featureDefaultsToValues = (
  defaults: Record<TCapability, boolean>,
): TSettingsFeaturesValues => {
  const values = {} as TSettingsFeaturesValues;
  for (const { capability, field } of CAPABILITY_TOGGLES) {
    values[field] = defaults[capability];
  }
  return values;
};

/**
 * Forces every capability outside `entitledCapabilities` to `false` before
 * the values ever reach the form. A stale `true` left over from a plan
 * downgrade would otherwise render a locked toggle checked-but-disabled and
 * ride along in every subsequent save payload, permanently tripping
 * `updateFeaturesAction`'s reject-whole-save check even when the operator
 * only touches an entitled field.
 */
export const clampToEntitlement = (
  values: TSettingsFeaturesValues,
  entitledCapabilities: TCapability[],
): TSettingsFeaturesValues => {
  const clamped = { ...values };
  for (const { capability, field } of CAPABILITY_TOGGLES) {
    if (!entitledCapabilities.includes(capability)) {
      clamped[field] = false;
    }
  }
  return clamped;
};

export const withComingSoonOff = (
  values: TSettingsFeaturesValues,
): TSettingsFeaturesValues => {
  const clamped = { ...values };
  for (const { field, isComingSoon } of CAPABILITY_TOGGLES) {
    if (isComingSoon) {
      clamped[field] = false;
    }
  }
  return clamped;
};
