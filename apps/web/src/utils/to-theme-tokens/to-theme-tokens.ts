import {
  isAccentHueAccessible,
  PRESET_ID,
  PRESET_REGISTRY,
  type TButtonShape,
  type TCardStyle,
  type TFontChoice,
  type THeaderControlShape,
  type THeaderControlStyle,
  type TNavLinkStyle,
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
  cardStyle: TCardStyle;
  headerControlStyle: THeaderControlStyle;
  headerControlShape: THeaderControlShape;
  buttonShape: TButtonShape;
  navLinkStyle: TNavLinkStyle;
};

export const toThemeTokens = (
  row: TThemeTokensRow | undefined,
): TThemeTokens => {
  const preset = row?.preset ?? PRESET_ID.CONSOLE;
  const {
    themeTokens: base,
    cardStyle,
    headerControlStyle,
    headerControlShape,
    buttonShape,
    navLinkStyle,
  } = PRESET_REGISTRY[preset];

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
    cardStyle: row?.cardStyle ?? cardStyle,
    headerControlStyle: row?.headerControlStyle ?? headerControlStyle,
    headerControlShape: row?.headerControlShape ?? headerControlShape,
    buttonShape: row?.buttonShape ?? buttonShape,
    navLinkStyle: row?.navLinkStyle ?? navLinkStyle,
  };
};
