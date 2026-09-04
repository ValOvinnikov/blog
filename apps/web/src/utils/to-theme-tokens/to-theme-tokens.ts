import {
  isAccentHueAccessible,
  PRESET_ID,
  PRESET_REGISTRY,
  type TFontChoice,
  type TPresetId,
  type TRadiusScale,
  type TDensity,
  type TThemeTokens,
} from '@blog/config';

type TThemeTokensRow = {
  preset: TPresetId;
  accentHue: number;
  logoHue?: number;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
};

/**
 * Builds full theme tokens from a `site_config` row (or `undefined`, when no
 * row exists or the fetch failed) — the `@blog/db`-backed counterpart to
 * `@blog/service`'s Sanity theme transformer, same fallback and WCAG-AA
 * accent-hue guard.
 */
export const toThemeTokens = (
  row: TThemeTokensRow | undefined,
): TThemeTokens => {
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
};
