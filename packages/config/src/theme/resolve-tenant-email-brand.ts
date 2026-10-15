import { oklchToHex } from '@blog/utils/color';

import { PRESET_REGISTRY, type TPresetId } from '@blog/config/constants';

import { isAccentHueAccessible } from './accent-hue-guard';
import {
  ACCENT_RAMP_LIGHT,
  LOGO_RAMP_LIGHT,
  type TOklchStop,
} from './theme-declarations';
import { NEUTRAL_RAMP_LIGHT } from './theme-ramps';

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

const toHex = ({ l, c, h }: TOklchStop, hue: number): string =>
  oklchToHex(l, c, h ?? hue);

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
    surface: toHex(NEUTRAL_RAMP_LIGHT['--surface'], resolvedAccentHue),
    surface2: toHex(NEUTRAL_RAMP_LIGHT['--surface-2'], resolvedAccentHue),
    border: toHex(NEUTRAL_RAMP_LIGHT['--border'], resolvedAccentHue),
    text: toHex(NEUTRAL_RAMP_LIGHT['--text'], resolvedAccentHue),
    textMuted: toHex(NEUTRAL_RAMP_LIGHT['--text-muted'], resolvedAccentHue),
    brandPrimary: toHex(
      ACCENT_RAMP_LIGHT['--brand-primary'],
      resolvedAccentHue,
    ),
    brandPrimarySolid: toHex(
      ACCENT_RAMP_LIGHT['--brand-primary-solid'],
      resolvedAccentHue,
    ),
    brandPrimaryContrast: toHex(
      ACCENT_RAMP_LIGHT['--brand-primary-contrast'],
      resolvedAccentHue,
    ),
    logo1: toHex(LOGO_RAMP_LIGHT['--logo-1'], resolvedLogoHue),
    logo2: toHex(LOGO_RAMP_LIGHT['--logo-2'], resolvedLogoHue),
    logo3: toHex(LOGO_RAMP_LIGHT['--logo-3'], resolvedLogoHue),
  };
};
