import { isUndefined } from '@blog/utils/primitives';
import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';
import { LOOK_ROW } from '@platform/constants/look-row';
import {
  brandAssetKindSchema,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { isSameStagedImage } from '@platform/utils/staged-image/staged-image';

export const CARD_FIELDS = {
  [LOOK_CARD.PRESET]: ['preset'],
  [LOOK_ROW.COLOUR]: ['accentHue', 'logoHue'],
  [LOOK_ROW.TYPE]: ['headingFont', 'bodyFont'],
  [LOOK_ROW.SHAPE]: ['radiusScale', 'density'],
  [LOOK_ROW.CARDS]: ['cardStyle'],
  [LOOK_ROW.HEADER]: [
    'headerLayout',
    'headerSubmenuStyle',
    'headerBarStyle',
    'headerControlStyle',
    'accountButtonStyle',
    'accountPanelStyle',
    'accountPhonePlacement',
  ],
  [LOOK_ROW.BUTTONS]: ['buttonShape', 'busyButtonStyle', 'spinnerStyle'],
  [LOOK_ROW.FOOTER]: [
    'footerLayout',
    'footerBackground',
    'footerSurface',
    'cookieSettingsButton',
  ],
  [LOOK_ROW.BRAND]: ['brandName', 'logo', 'favicon'],
  [LOOK_ROW.LANGUAGE_SWITCHER]: ['languageSwitcherStyle'],
} as const satisfies Record<TLookCard, readonly (keyof TLookFormValues)[]>;

const BRAND_ASSET_KINDS = brandAssetKindSchema.options;

export const isBrandAssetKind = (
  key: keyof TLookFormValues,
): key is TBrandAssetKind =>
  (BRAND_ASSET_KINDS as readonly string[]).includes(key);

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
