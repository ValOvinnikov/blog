import {
  PRESET_ID,
  PRESET_REGISTRY,
  resolveTenantEmailBrand,
  type TMaybeUndefined,
  type TPresetId,
  type TTenantEmailBrand,
} from '@shinefold/config';

type TSiteConfigBrandRow = {
  preset: TPresetId;
  accentHue: number;
  logoHue?: number;
  buttonColor?: string;
};

export const toTenantEmailBrand = (
  row: TMaybeUndefined<TSiteConfigBrandRow>,
): TTenantEmailBrand => {
  const preset = row?.preset ?? PRESET_ID.CONSOLE;
  const base = PRESET_REGISTRY[preset].themeTokens;

  return resolveTenantEmailBrand({
    preset,
    accentHue: row?.accentHue ?? base.accentHue,
    logoHue: row?.logoHue ?? base.logoHue,
    buttonColor: row?.buttonColor,
  });
};
