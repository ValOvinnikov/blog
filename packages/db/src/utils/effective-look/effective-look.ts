import {
  LANGUAGE_SWITCHER_STYLE,
  type TPresetId,
  type TTenantPlan,
} from '@shinefold/config/constants';
import {
  LOOK_FIELDS,
  PLAN_ENTITLEMENTS,
  type TLookField,
} from '@shinefold/db/constants';
import type { TSiteConfigResult } from '@shinefold/db/queries/site-config/get-site-config';
import { presetSiteConfig } from '@shinefold/db/utils/preset-site-config/preset-site-config';
import type { TTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export type TLook = Pick<TSiteConfigResult, TLookField>;

type TLookInput = Partial<TLook> & Pick<TLook, 'preset'>;

function presetLook(preset: TPresetId): TLook {
  return {
    ...presetSiteConfig(preset),
    logoHue: undefined,
    languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    brandName: undefined,
    logoAssetUrl: undefined,
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

export function isLookFieldEntitled(
  field: TLookField,
  plan: TTenantPlan,
): boolean {
  return isLookFieldWithin(field, PLAN_ENTITLEMENTS[plan]);
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

export function toEffectiveLook<T extends TLookInput>(
  look: T,
  plan: TTenantPlan,
): T {
  return toEffectiveLookWithin(look, PLAN_ENTITLEMENTS[plan]);
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

export function pickEntitledLook<
  T extends Partial<Record<TLookField, unknown>>,
>(look: T, plan: TTenantPlan): Partial<T> {
  return pickLookWithin(look, PLAN_ENTITLEMENTS[plan]);
}
