import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';
import { LOOK_ROW } from '@platform/constants/look-row';
import {
  brandAssetKindSchema,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { isSameStagedImage } from '@platform/utils/staged-image/staged-image';
import { LOOK_FIELD } from '@shinefold/db/constants';
import {
  isLookFieldWithin,
  type TEffectiveLookEntitlements,
  toEffectiveLookWithin,
} from '@shinefold/db/utils/effective-look/effective-look';
import { isUndefined } from '@shinefold/utils/primitives';

export const CARD_FIELDS = {
  [LOOK_CARD.PRESET]: ['preset'],
  [LOOK_ROW.BRAND]: ['brandName', 'logo', 'logoDark', 'logoHue', 'favicon'],
  [LOOK_ROW.COLOUR]: [
    'accentHue',
    'buttonColor',
    'buttonColorDark',
    LOOK_FIELD.COLOR_MODE,
  ],
  [LOOK_ROW.TYPE]: ['headingFont', 'bodyFont', 'headingWeight', 'headingCase'],
  [LOOK_ROW.SHAPE]: [
    'radiusScale',
    'buttonShape',
    'density',
    'cardStyle',
    'imageProportion',
    'dividerWidth',
  ],
  [LOOK_ROW.HEADER]: [
    'headerLayout',
    'headerBarStyle',
    'headerBackground',
    'headerSubmenuStyle',
    'navLinkStyle',
    'headerControlStyle',
    'headerControlShape',
    LOOK_FIELD.LANGUAGE_SWITCHER_STYLE,
    'headerActionStyle',
    'headerActionPhonePlacement',
    'accountButtonStyle',
    'accountPanelStyle',
    'accountPhonePlacement',
  ],
  [LOOK_ROW.FOOTER]: ['footerLayout', 'footerBackground', 'footerSurface'],
  [LOOK_ROW.DETAILS]: [
    'spinnerStyle',
    'busyButtonStyle',
    'breadcrumbBackground',
    'cookieSettingsButton',
  ],
} as const satisfies Record<TLookCard, readonly (keyof TLookFormValues)[]>;

const BRAND_ASSET_KINDS = brandAssetKindSchema.options;

export const isBrandAssetKind = (
  key: keyof TLookFormValues,
): key is TBrandAssetKind =>
  (BRAND_ASSET_KINDS as readonly string[]).includes(key);

/** The effective Look for the form, keeping the saved button colour so an unsaved one follows the preset rather than reading as picked. */
export const toLookFormValuesWithin = (
  values: TLookFormValues,
  entitlements: TEffectiveLookEntitlements,
): TLookFormValues => ({
  ...toEffectiveLookWithin(values, entitlements),
  buttonColor: isLookFieldWithin(LOOK_FIELD.BUTTON_COLOR, entitlements)
    ? values.buttonColor
    : undefined,
});

export const restoreLookDraft = (
  draftValues: TLookFormValues,
  { logo, logoDark, favicon }: TLookFormValues,
  entitlements: TEffectiveLookEntitlements,
): TLookFormValues => ({
  ...toLookFormValuesWithin(draftValues, entitlements),
  logo,
  logoDark,
  favicon,
});

export const isFieldChanged = (
  key: keyof TLookFormValues,
  a: TLookFormValues,
  b: TLookFormValues,
): boolean =>
  isBrandAssetKind(key)
    ? !isSameStagedImage(a[key], b[key])
    : a[key] !== b[key];

export const countChanges = (a: TLookFormValues, b: TLookFormValues): number =>
  (Object.keys(a) as (keyof TLookFormValues)[]).filter((key) =>
    isFieldChanged(key, a, b),
  ).length;

// A stored draft is JSON, so a staged file comes back as `{}` behind a dead object URL.
export const listLostStagedFiles = (
  draftValues: TLookFormValues,
): TBrandAssetKind[] =>
  BRAND_ASSET_KINDS.filter((kind) => !isUndefined(draftValues[kind].file));
