import {
  ACCENT_RAMP_DARK,
  ACCENT_RAMP_LIGHT,
  CARD_STYLE_DECLARATIONS,
  DENSITY_DECLARATIONS,
  formatOklchRamp,
  HEADER_CONTROL_STYLE_DECLARATIONS,
  HUE_MAX,
  HUE_MIN,
  LOGO_RAMP_DARK,
  LOGO_RAMP_LIGHT,
  RADIUS_DECLARATIONS,
  type TCardStyle,
  type TDensity,
  type TFontChoice,
  type THeaderControlStyle,
  type TMaybeUndefined,
  type TRadiusScale,
  type TThemeDeclarations,
} from '@blog/config';
import { FONT_OPTIONS } from '@platform/config/fonts';
import type { CSSProperties } from 'react';

const HUE_GRADIENT_STEP = 20;

// theme.css derives these in @theme, i.e. on :root, so they must be re-derived where the preview overrides their inputs.
const DERIVED_RADIUS_DECLARATIONS: TThemeDeclarations = {
  '--radius-card': 'var(--radius-md)',
  '--radius-media': 'var(--radius-lg)',
  '--radius-item': 'var(--item-radius)',
};

export const buildAccentPreviewTokens = (hue: number, isDark: boolean) => {
  return formatOklchRamp(isDark ? ACCENT_RAMP_DARK : ACCENT_RAMP_LIGHT, hue);
};

export const buildLogoPreviewTokens = (hue: number, isDark: boolean) => {
  return formatOklchRamp(isDark ? LOGO_RAMP_DARK : LOGO_RAMP_LIGHT, hue);
};

type TShapePreviewValues = {
  radiusScale: TRadiusScale;
  density: TDensity;
  cardStyle: TCardStyle;
  headerControlStyle: THeaderControlStyle;
};

const buildShapePreviewTokens = ({
  radiusScale,
  density,
  cardStyle,
  headerControlStyle,
}: TShapePreviewValues): TThemeDeclarations => {
  return {
    ...RADIUS_DECLARATIONS[radiusScale],
    ...DENSITY_DECLARATIONS[density],
    ...CARD_STYLE_DECLARATIONS[cardStyle],
    ...HEADER_CONTROL_STYLE_DECLARATIONS[headerControlStyle],
    ...DERIVED_RADIUS_DECLARATIONS,
  };
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
