import { PRESET_REGISTRY, type TPresetId } from '@blog/config';
import {
  brandAssetKindSchema,
  type TBrandAssetKind,
} from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { isSameStagedImage } from '@platform/utils/staged-image/staged-image';

export const applyPresetDefaults = (
  preset: TPresetId,
  current: TLookFormValues,
): TLookFormValues => {
  const {
    themeTokens: tokens,
    cardStyle,
    headerControlStyle,
  } = PRESET_REGISTRY[preset];

  return {
    preset,
    accentHue: tokens.accentHue,
    logoHue: undefined,
    headingFont: tokens.headingFont,
    bodyFont: tokens.bodyFont,
    radiusScale: tokens.radiusScale,
    density: tokens.density,
    cardStyle,
    headerControlStyle,
    languageSwitcherStyle: current.languageSwitcherStyle,
    logo: current.logo,
    favicon: current.favicon,
  };
};

export const CARD_FIELDS = {
  preset: ['preset'],
  colour: ['accentHue', 'logoHue'],
  type: ['headingFont', 'bodyFont'],
  shape: ['radiusScale', 'density', 'cardStyle', 'headerControlStyle'],
  brand: ['logo', 'favicon'],
  languageSwitcher: ['languageSwitcherStyle'],
} as const satisfies Record<string, readonly (keyof TLookFormValues)[]>;

export type TLookCardKey = keyof typeof CARD_FIELDS;

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
  BRAND_ASSET_KINDS.filter((kind) => draftValues[kind].file !== undefined);
