import {
  PRESET_ID,
  PRESET_REGISTRY,
  resolveTenantEmailBrand,
  type TPresetId,
  type TTenantEmailBrand,
} from '@blog/config';

type TSiteConfigBrandRow = {
  preset: TPresetId;
  accentHue: number;
  logoHue?: number;
};

/**
 * Builds a tenant's resolved email brand from a `site_config` row (or
 * `undefined`, when no row exists or the fetch failed), falling back to the
 * Console preset the same way `toThemeTokens` does for the site itself.
 */
export const toTenantEmailBrand = (
  row: TSiteConfigBrandRow | undefined,
): TTenantEmailBrand => {
  const preset = row?.preset ?? PRESET_ID.CONSOLE;
  const base = PRESET_REGISTRY[preset].themeTokens;

  return resolveTenantEmailBrand({
    preset,
    accentHue: row?.accentHue ?? base.accentHue,
    logoHue: row?.logoHue ?? base.logoHue,
  });
};
