import {
  CAPABILITY,
  isComingSoonCapability,
  type TCapability,
  type TMaybeUndefined,
} from '@blog/config';

export type TSettingsFeaturesValues = {
  readerAccountsEnabled: boolean;
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
  isComingSoon: boolean;
  parentField: TMaybeUndefined<keyof TSettingsFeaturesValues>;
};

const CAPABILITY_FIELDS: Record<TCapability, keyof TSettingsFeaturesValues> = {
  [CAPABILITY.READER_ACCOUNTS]: 'readerAccountsEnabled',
  [CAPABILITY.COMMENTS]: 'commentsEnabled',
  [CAPABILITY.RATINGS]: 'ratingsEnabled',
  [CAPABILITY.BOOKMARKS]: 'bookmarksEnabled',
  [CAPABILITY.NEWSLETTER]: 'newsletterEnabled',
  [CAPABILITY.ANALYTICS]: 'analyticsEnabled',
  [CAPABILITY.CONSENT_BANNER]: 'consentBannerEnabled',
  [CAPABILITY.CONTACT_FORM]: 'contactFormEnabled',
};

const PARENT_FIELDS: Partial<
  Record<TCapability, keyof TSettingsFeaturesValues>
> = {
  [CAPABILITY.COMMENTS]: 'readerAccountsEnabled',
  [CAPABILITY.RATINGS]: 'readerAccountsEnabled',
  [CAPABILITY.BOOKMARKS]: 'readerAccountsEnabled',
};

export const CAPABILITY_TOGGLES: TCapabilityToggle[] = Object.values(
  CAPABILITY,
).map((capability) => ({
  capability,
  field: CAPABILITY_FIELDS[capability],
  isComingSoon: isComingSoonCapability(capability),
  parentField: PARENT_FIELDS[capability],
}));

export const featureDefaultsToValues = (
  defaults: Record<TCapability, boolean>,
): TSettingsFeaturesValues => {
  const values = {} as TSettingsFeaturesValues;
  for (const { capability, field } of CAPABILITY_TOGGLES) {
    values[field] = defaults[capability];
  }
  return values;
};

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

export const listSwitchedOnOutOfPlan = (
  values: TSettingsFeaturesValues,
  stored: TSettingsFeaturesValues,
  entitledCapabilities: TCapability[],
): (keyof TSettingsFeaturesValues)[] =>
  CAPABILITY_TOGGLES.filter(
    ({ capability, field }) =>
      values[field] &&
      !stored[field] &&
      !entitledCapabilities.includes(capability),
  ).map(({ field }) => field);

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
