import { CAPABILITY, type TCapability } from '@blog/config';

/**
 * The five `settings_features` toggle columns, keyed the same way
 * `@blog/db`'s `getSettingsFeatures`/`upsertSettingsFeatures` already are —
 * this is the admin-side view-model shape, not a redeclaration of the row.
 */
export type TSettingsFeaturesValues = {
  commentsEnabled: boolean;
  ratingsEnabled: boolean;
  bookmarksEnabled: boolean;
  newsletterEnabled: boolean;
  analyticsEnabled: boolean;
};

export type TCapabilityToggle = {
  capability: TCapability;
  field: keyof TSettingsFeaturesValues;
};

/**
 * The single source of truth mapping each `TCapability` to its
 * `settings_features` column — the Features tab renders one row per entry,
 * and the Server Action walks the same list to re-check plan entitlement
 * per capability before writing anything.
 */
export const CAPABILITY_TOGGLES: TCapabilityToggle[] = [
  { capability: CAPABILITY.COMMENTS, field: 'commentsEnabled' },
  { capability: CAPABILITY.RATINGS, field: 'ratingsEnabled' },
  { capability: CAPABILITY.BOOKMARKS, field: 'bookmarksEnabled' },
  { capability: CAPABILITY.NEWSLETTER, field: 'newsletterEnabled' },
  { capability: CAPABILITY.ANALYTICS, field: 'analyticsEnabled' },
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
