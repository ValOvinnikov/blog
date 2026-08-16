import {
  PRESET_ID,
  PRESET_REGISTRY,
  type TFontChoice,
  type TPresetId,
  type TRadiusScale,
  type TDensity,
  type TThemeTokens,
} from '@blog/config';
import { WCAG_AA_CONTRAST_MIN, wcagContrastRatio } from '@blog/utils';

type TThemeTokensRow = {
  preset: TPresetId;
  accentHue: number;
  logoHue?: number;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
};

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

/**
 * Builds full theme tokens from a `site_config` row (or `undefined`, when no
 * row exists or the fetch failed) — the `@blog/db`-backed counterpart to
 * `@blog/service`'s Sanity theme transformer, same fallback and WCAG-AA
 * accent-hue guard.
 */
export function toThemeTokens(row: TThemeTokensRow | undefined): TThemeTokens {
  const preset = row?.preset ?? PRESET_ID.CONSOLE;
  const base = PRESET_REGISTRY[preset].themeTokens;

  const requestedAccentHue = row?.accentHue ?? base.accentHue;
  const accentHue = isAccentHueAccessible(requestedAccentHue)
    ? requestedAccentHue
    : base.accentHue;

  return {
    accentHue,
    logoHue: row?.logoHue ?? base.logoHue ?? accentHue,
    headingFont: row?.headingFont ?? base.headingFont,
    bodyFont: row?.bodyFont ?? base.bodyFont,
    radiusScale: row?.radiusScale ?? base.radiusScale,
    density: row?.density ?? base.density,
    chromeOn: base.chromeOn,
  };
}
