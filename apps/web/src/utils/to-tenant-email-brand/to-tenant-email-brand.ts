import {
  PRESET_ID,
  PRESET_REGISTRY,
  resolveTenantEmailBrand,
  type TMaybeUndefined,
  type TResolveTenantEmailBrandInput,
  type TTenantEmailBrand,
} from '@shinefold/config';

export const toTenantEmailBrand = (
  row: TMaybeUndefined<TResolveTenantEmailBrandInput>,
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
