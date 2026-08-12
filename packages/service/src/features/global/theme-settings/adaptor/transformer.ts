import { PRESET_ID, PRESET_REGISTRY, type TThemeTokens } from '@blog/config';
import { WCAG_AA_CONTRAST_MIN, wcagContrastRatio } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { themeSettingsQuery } from './query';

export type TRawThemeSettings = InferResultType<typeof themeSettingsQuery>;

// Fixed L/C for --text and --brand-primary-muted (configs/tailwind/theme.css) —
// only hue rotates per accentHue, so this is the pairing the WCAG guard below checks.
const TEXT_LIGHT = { l: 0.2, c: 0.01, h: 250 };
const TEXT_DARK = { l: 0.95, c: 0.004, h: 250 };
const BRAND_PRIMARY_MUTED_LIGHT_LC = { l: 0.95, c: 0.03 };
const BRAND_PRIMARY_MUTED_DARK_LC = { l: 0.3, c: 0.06 };

function isAccentHueAccessible(hue: number): boolean {
  const light = wcagContrastRatio(TEXT_LIGHT, {
    ...BRAND_PRIMARY_MUTED_LIGHT_LC,
    h: hue,
  });
  const dark = wcagContrastRatio(TEXT_DARK, {
    ...BRAND_PRIMARY_MUTED_DARK_LC,
    h: hue,
  });
  return light >= WCAG_AA_CONTRAST_MIN && dark >= WCAG_AA_CONTRAST_MIN;
}

export function toThemeTokens(raw: TRawThemeSettings): TThemeTokens {
  const preset = raw?.preset ?? PRESET_ID.CONSOLE;
  const base = PRESET_REGISTRY[preset].themeTokens;

  const requestedAccentHue = raw?.accentHue ?? base.accentHue;
  // A tenant override that fails AA falls back to the preset's own accentHue,
  // pre-verified safe (see the plan's Contracts section) — never ships an
  // inaccessible tint.
  const accentHue = isAccentHueAccessible(requestedAccentHue)
    ? requestedAccentHue
    : base.accentHue;

  return {
    accentHue,
    logoHue: raw?.logoHue ?? base.logoHue ?? accentHue,
    headingFont: raw?.headingFont ?? base.headingFont,
    bodyFont: raw?.bodyFont ?? base.bodyFont,
    radiusScale: raw?.radiusScale ?? base.radiusScale,
    density: raw?.density ?? base.density,
    chromeOn: base.chromeOn,
  };
}
