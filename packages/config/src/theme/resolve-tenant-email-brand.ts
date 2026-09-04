import { oklchToHex } from '@blog/utils';

import { PRESET_REGISTRY, type TPresetId } from '@blog/config/constants';

import { isAccentHueAccessible } from './accent-hue-guard';

export type TResolveTenantEmailBrandInput = {
  preset: TPresetId;
  accentHue: number;
  logoHue?: number;
};

export type TTenantEmailBrand = {
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
  brandPrimary: string;
  brandPrimarySolid: string;
  brandPrimaryContrast: string;
  logo1: string;
  logo2: string;
  logo3: string;
};

/**
 * Resolves a tenant's brand palette to literal hex for email, running the
 * same light-mode OKLCH recipes `apps/web` injects as CSS custom properties
 * and applying the WCAG AA accent-hue guard email cannot express as CSS.
 */
export const resolveTenantEmailBrand = ({
  preset,
  accentHue,
  logoHue,
}: TResolveTenantEmailBrandInput): TTenantEmailBrand => {
  const base = PRESET_REGISTRY[preset].themeTokens;
  const resolvedAccentHue = isAccentHueAccessible(accentHue)
    ? accentHue
    : base.accentHue;
  const resolvedLogoHue = logoHue ?? base.logoHue ?? resolvedAccentHue;

  return {
    surface: oklchToHex(1, 0, 0),
    surface2: oklchToHex(0.975, 0.003, 250),
    border: oklchToHex(0.9, 0.004, 250),
    text: oklchToHex(0.2, 0.01, 250),
    textMuted: oklchToHex(0.46, 0.01, 250),
    brandPrimary: oklchToHex(0.53, 0.17, resolvedAccentHue),
    brandPrimarySolid: oklchToHex(0.55, 0.17, resolvedAccentHue),
    brandPrimaryContrast: oklchToHex(0.99, 0, 0),
    logo1: oklchToHex(0.52, 0.17, resolvedLogoHue),
    logo2: oklchToHex(0.63, 0.16, resolvedLogoHue),
    logo3: oklchToHex(0.73, 0.13, resolvedLogoHue),
  };
};
