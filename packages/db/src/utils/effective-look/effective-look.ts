import {
  COLOR_MODE,
  LANGUAGE_SWITCHER_STYLE,
  OPEN_PRESET_IDS,
  type TPresetId,
} from '@shinefold/config/constants';
import { LOOK_FIELDS, type TLookField } from '@shinefold/db/constants';
import type { TSiteConfigResult } from '@shinefold/db/queries/site-config/get-site-config';
import { presetSiteConfig } from '@shinefold/db/utils/preset-site-config/preset-site-config';
import type { TTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';
import { isOneOf } from '@shinefold/utils/primitives';

export type TLook = Pick<TSiteConfigResult, TLookField>;

type TLookInput = Partial<TLook> & Pick<TLook, 'preset'>;

function presetLook(preset: TPresetId): TLook {
  return {
    ...presetSiteConfig(preset),
    logoHue: undefined,
    languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    colorMode: COLOR_MODE.READER,
    brandName: undefined,
    logoAssetUrl: undefined,
    logoDarkAssetUrl: undefined,
    faviconAssetUrl: undefined,
  };
}

type TLookEntitlements = Pick<TTenantEntitlements, 'lookFields'>;

export function isLookFieldWithin(
  field: TLookField,
  { lookFields }: TLookEntitlements,
): boolean {
  return lookFields.includes(field);
}

export function isPresetWithin(
  preset: TPresetId,
  { unlockedPresets }: Pick<TTenantEntitlements, 'unlockedPresets'>,
): boolean {
  return isOneOf(OPEN_PRESET_IDS, preset) || isOneOf(unlockedPresets, preset);
}

/** The Look a site renders: every field outside the entitlements takes its preset's value, whatever is stored. */
export function toEffectiveLookWithin<T extends TLookInput>(
  look: T,
  entitlements: TLookEntitlements,
): T {
  const fallback = presetLook(look.preset);
  const locked = LOOK_FIELDS.filter(
    (field) => field in look && !isLookFieldWithin(field, entitlements),
  );

  return {
    ...look,
    ...Object.fromEntries(locked.map((field) => [field, fallback[field]])),
  };
}

export function pickLookWithin<T extends Partial<Record<TLookField, unknown>>>(
  look: T,
  entitlements: TLookEntitlements,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(look).filter(([field]) =>
      isLookFieldWithin(field as TLookField, entitlements),
    ),
  ) as Partial<T>;
}
