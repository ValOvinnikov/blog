import { FONT_OPTIONS } from '@platform/config/fonts';
import {
  buildShapePreviewTokens,
  type TShapePreviewValues,
} from '@platform/utils/shape-preview-tokens/shape-preview-tokens';
import {
  ACCENT_RAMP_DARK,
  ACCENT_RAMP_LIGHT,
  BRAND_PALETTE,
  formatOklchRamp,
  HUE_MAX,
  HUE_MIN,
  IMAGE_SCRIM_RAMP,
  LOGO_RAMP_DARK,
  LOGO_RAMP_LIGHT,
  type TFontChoice,
  type TMaybeUndefined,
} from '@shinefold/config';
import type { CSSProperties } from 'react';

const HUE_GRADIENT_STEP = 20;

export const buildAccentPreviewTokens = (hue: number, isDark: boolean) => {
  return formatOklchRamp(isDark ? ACCENT_RAMP_DARK : ACCENT_RAMP_LIGHT, hue);
};

export const buildLogoPreviewTokens = (hue: number, isDark: boolean) => {
  return formatOklchRamp(isDark ? LOGO_RAMP_DARK : LOGO_RAMP_LIGHT, hue);
};

export type TThemePreviewValues = TShapePreviewValues & {
  accentHue: number;
  logoHue: TMaybeUndefined<number>;
};

export const buildThemePreviewStyle = (
  { accentHue, logoHue, ...shape }: TThemePreviewValues,
  isDark: boolean,
): CSSProperties =>
  ({
    ...formatOklchRamp(BRAND_PALETTE, accentHue),
    ...formatOklchRamp(IMAGE_SCRIM_RAMP, accentHue),
    ...buildAccentPreviewTokens(accentHue, isDark),
    ...buildLogoPreviewTokens(logoHue ?? accentHue, isDark),
    ...buildShapePreviewTokens(shape),
  }) as CSSProperties;

export type TSitePreviewThemeValues = TThemePreviewValues & {
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
};

export type TSitePreviewTheme = {
  tokenStyle: CSSProperties;
  isDark: boolean;
  headingFontFamily: string;
  bodyFontFamily: string;
};

export const buildSitePreviewTheme = (
  values: TSitePreviewThemeValues,
  isDark: boolean,
): TSitePreviewTheme => ({
  tokenStyle: buildThemePreviewStyle(values, isDark),
  isDark,
  headingFontFamily: FONT_OPTIONS[values.headingFont].fontFamily,
  bodyFontFamily: FONT_OPTIONS[values.bodyFont].fontFamily,
});

/**
 * The accent-hue slider's track gradient, sampled from the light-mode swatch
 * formula whatever the preview panel's own light/dark toggle shows.
 */
export const accentHueGradient = (): string => {
  const stops: string[] = [];

  for (let hue = HUE_MIN; hue <= HUE_MAX; hue += HUE_GRADIENT_STEP) {
    stops.push(buildAccentPreviewTokens(hue, false)['--brand-primary']);
  }

  return `linear-gradient(90deg, ${stops.join(', ')})`;
};
