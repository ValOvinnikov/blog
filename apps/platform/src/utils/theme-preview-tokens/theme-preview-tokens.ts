import {
  ACCENT_RAMP_DARK,
  ACCENT_RAMP_LIGHT,
  CARD_STYLE_DECLARATIONS,
  DENSITY_DECLARATIONS,
  formatOklchRamp,
  LOGO_RAMP_DARK,
  LOGO_RAMP_LIGHT,
  RADIUS_DECLARATIONS,
  type TCardStyle,
  type TDensity,
  type TRadiusScale,
  type TThemeDeclarations,
} from '@blog/config';

const HUE_MIN = 0;
const HUE_MAX = 360;
const HUE_GRADIENT_STEP = 20;

export const buildAccentPreviewTokens = (hue: number, isDark: boolean) => {
  return formatOklchRamp(isDark ? ACCENT_RAMP_DARK : ACCENT_RAMP_LIGHT, hue);
};

export const buildLogoPreviewTokens = (hue: number, isDark: boolean) => {
  return formatOklchRamp(isDark ? LOGO_RAMP_DARK : LOGO_RAMP_LIGHT, hue);
};

export const buildShapePreviewTokens = (
  radiusScale: TRadiusScale,
  density: TDensity,
  cardStyle: TCardStyle,
): TThemeDeclarations => {
  return {
    ...RADIUS_DECLARATIONS[radiusScale],
    ...DENSITY_DECLARATIONS[density],
    ...CARD_STYLE_DECLARATIONS[cardStyle],
  };
};

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
