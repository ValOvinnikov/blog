import { CAPABILITY, type TCapability } from '@blog/config';

export type TSettingsFeaturesValues = {
  commentsEnabled: boolean;
  ratingsEnabled: boolean;
  bookmarksEnabled: boolean;
  newsletterEnabled: boolean;
  analyticsEnabled: boolean;
  consentBannerEnabled: boolean;
  contactFormEnabled: boolean;
};

export type TCapabilityToggle = {
  capability: TCapability;
  field: keyof TSettingsFeaturesValues;
  isComingSoon?: boolean;
};

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
  { capability: CAPABILITY.CONTACT_FORM, field: 'contactFormEnabled' },
];

export const featureDefaultsToValues = (
  defaults: Record<TCapability, boolean>,
): TSettingsFeaturesValues => {
  const values = {} as TSettingsFeaturesValues;
  for (const { capability, field } of CAPABILITY_TOGGLES) {
    values[field] = defaults[capability];
  }
  return values;
};

/** A stale `true` from a plan downgrade would otherwise ride along in every save and trip `updateFeaturesAction`'s reject-whole-save check. */
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

export const keepStoredOutOfPlan = (
  values: TSettingsFeaturesValues,
  stored: TSettingsFeaturesValues,
  entitledCapabilities: TCapability[],
): TSettingsFeaturesValues => {
  const kept = { ...values };
  for (const { capability, field } of CAPABILITY_TOGGLES) {
    if (!entitledCapabilities.includes(capability)) {
      kept[field] = stored[field];
    }
  }
  return kept;
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
