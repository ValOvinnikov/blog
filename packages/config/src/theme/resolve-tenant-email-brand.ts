import { PRESET_REGISTRY, type TPresetId } from '@blog/config/constants';

import { isAccentHueAccessible } from './accent-hue-guard';
import { ACCENT_RAMP_LIGHT } from './accent-ramps';
import { LOGO_RAMP_LIGHT, oklchStopToHex } from './theme-declarations';
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
    surface: oklchStopToHex(NEUTRAL_RAMP_LIGHT['--surface'], resolvedAccentHue),
    surface2: oklchStopToHex(
      NEUTRAL_RAMP_LIGHT['--surface-2'],
      resolvedAccentHue,
    ),
    border: oklchStopToHex(NEUTRAL_RAMP_LIGHT['--border'], resolvedAccentHue),
    text: oklchStopToHex(NEUTRAL_RAMP_LIGHT['--text'], resolvedAccentHue),
    textMuted: oklchStopToHex(
      NEUTRAL_RAMP_LIGHT['--text-muted'],
      resolvedAccentHue,
    ),
    brandPrimary: oklchStopToHex(
      ACCENT_RAMP_LIGHT['--brand-primary'],
      resolvedAccentHue,
    ),
    brandPrimarySolid: oklchStopToHex(
      ACCENT_RAMP_LIGHT['--brand-primary-solid'],
      resolvedAccentHue,
    ),
    brandPrimaryContrast: oklchStopToHex(
      ACCENT_RAMP_LIGHT['--brand-primary-contrast'],
      resolvedAccentHue,
    ),
    logo1: oklchStopToHex(LOGO_RAMP_LIGHT['--logo-1'], resolvedLogoHue),
    logo2: oklchStopToHex(LOGO_RAMP_LIGHT['--logo-2'], resolvedLogoHue),
    logo3: oklchStopToHex(LOGO_RAMP_LIGHT['--logo-3'], resolvedLogoHue),
  };
};
