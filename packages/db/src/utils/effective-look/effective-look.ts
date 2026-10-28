import {
  LANGUAGE_SWITCHER_STYLE,
  PRESET_REGISTRY,
  type TPresetId,
} from '@blog/config/constants';
import {
  LOOK_FIELDS,
  PLAN_ENTITLEMENTS,
  type TLookField,
  type TTenantPlan,
} from '@blog/db/constants';
import type { TSiteConfigResult } from '@blog/db/queries/site-config/get-site-config';

export type TLook = Pick<TSiteConfigResult, TLookField>;

type TLookInput = Partial<TLook> & Pick<TLook, 'preset'>;

function presetLook(preset: TPresetId): TLook {
  const {
    themeTokens: { accentHue, headingFont, bodyFont, radiusScale, density },
    cardStyle,
    headerControlStyle,
    accountButtonStyle,
    accountPanelStyle,
    accountPhonePlacement,
    busyButtonStyle,
    spinnerStyle,
    headerLayout,
    headerSubmenuStyle,
    headerBarStyle,
  } = PRESET_REGISTRY[preset];

  return {
    preset,
    accentHue,
    logoHue: undefined,
    headingFont,
    bodyFont,
    radiusScale,
    density,
    languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
    cardStyle,
    headerControlStyle,
    accountButtonStyle,
    accountPanelStyle,
    accountPhonePlacement,
    busyButtonStyle,
    spinnerStyle,
    headerLayout,
    headerSubmenuStyle,
    headerBarStyle,
    logoAssetUrl: undefined,
    faviconAssetUrl: undefined,
  };
}

export function isLookFieldEntitled(
  field: TLookField,
  plan: TTenantPlan,
): boolean {
  return PLAN_ENTITLEMENTS[plan].lookFields.includes(field);
}

/** The Look a site renders: every field outside the plan takes its preset's value, whatever is stored. */
export function toEffectiveLook<T extends TLookInput>(
  look: T,
  plan: TTenantPlan,
): T {
  const fallback = presetLook(look.preset);
  const locked = LOOK_FIELDS.filter(
    (field) => field in look && !isLookFieldEntitled(field, plan),
  );

  return {
    ...look,
    ...Object.fromEntries(locked.map((field) => [field, fallback[field]])),
  };
}

export function pickEntitledLook<
  T extends Partial<Record<TLookField, unknown>>,
>(look: T, plan: TTenantPlan): Partial<T> {
  return Object.fromEntries(
    Object.entries(look).filter(([field]) =>
      isLookFieldEntitled(field as TLookField, plan),
    ),
  ) as Partial<T>;
}
