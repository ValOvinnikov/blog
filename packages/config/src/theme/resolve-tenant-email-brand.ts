import { PRESET_REGISTRY, type TPresetId } from '@shinefold/config/constants';

import { isAccentHueAccessible } from './accent-hue-guard';
import {
  ACCENT_RAMP_DARK,
  ACCENT_RAMP_LIGHT,
  LOGO_RAMP_DARK,
  LOGO_RAMP_LIGHT,
} from './accent-ramps';
import { oklchStopToHex, type TOklchStop } from './theme-declarations';
import { NEUTRAL_RAMP_DARK, NEUTRAL_RAMP_LIGHT } from './theme-ramps';

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

type TEmailBrandRamps = {
  neutral: Record<
    '--surface' | '--surface-2' | '--border' | '--text' | '--text-muted',
    TOklchStop
  >;
  accent: Record<
    '--brand-primary' | '--brand-primary-solid' | '--brand-primary-contrast',
    TOklchStop
  >;
  logo: Record<'--logo-1' | '--logo-2' | '--logo-3', TOklchStop>;
};

const LIGHT_EMAIL_RAMPS: TEmailBrandRamps = {
  neutral: NEUTRAL_RAMP_LIGHT,
  accent: ACCENT_RAMP_LIGHT,
  logo: LOGO_RAMP_LIGHT,
};

const DARK_EMAIL_RAMPS: TEmailBrandRamps = {
  neutral: NEUTRAL_RAMP_DARK,
  accent: ACCENT_RAMP_DARK,
  logo: LOGO_RAMP_DARK,
};

const resolveEmailBrand = (
  { neutral, accent, logo }: TEmailBrandRamps,
  { preset, accentHue, logoHue }: TResolveTenantEmailBrandInput,
): TTenantEmailBrand => {
  const base = PRESET_REGISTRY[preset].themeTokens;
  const resolvedAccentHue = isAccentHueAccessible(accentHue)
    ? accentHue
    : base.accentHue;
  const resolvedLogoHue = logoHue ?? base.logoHue ?? resolvedAccentHue;
  const accentHex = (stop: TOklchStop) =>
    oklchStopToHex(stop, resolvedAccentHue);
  const logoHex = (stop: TOklchStop) => oklchStopToHex(stop, resolvedLogoHue);

  return {
    surface: accentHex(neutral['--surface']),
    surface2: accentHex(neutral['--surface-2']),
    border: accentHex(neutral['--border']),
    text: accentHex(neutral['--text']),
    textMuted: accentHex(neutral['--text-muted']),
    brandPrimary: accentHex(accent['--brand-primary']),
    brandPrimarySolid: accentHex(accent['--brand-primary-solid']),
    brandPrimaryContrast: accentHex(accent['--brand-primary-contrast']),
    logo1: logoHex(logo['--logo-1']),
    logo2: logoHex(logo['--logo-2']),
    logo3: logoHex(logo['--logo-3']),
  };
};

export const resolveTenantEmailBrand = (
  input: TResolveTenantEmailBrandInput,
): TTenantEmailBrand => resolveEmailBrand(LIGHT_EMAIL_RAMPS, input);

export const resolveTenantEmailDarkBrand = (
  input: TResolveTenantEmailBrandInput,
): TTenantEmailBrand => resolveEmailBrand(DARK_EMAIL_RAMPS, input);
