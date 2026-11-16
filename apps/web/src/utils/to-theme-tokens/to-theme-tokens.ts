import {
  isAccentHueAccessible,
  PRESET_ID,
  PRESET_REGISTRY,
  type TButtonShape,
  type TCardStyle,
  type TDividerWidth,
  type TFontChoice,
  type THeaderControlShape,
  type THeaderControlStyle,
  type THeadingCase,
  type THeadingWeight,
  type TImageProportion,
  type TNavLinkStyle,
  type TPresetId,
  type TRadiusScale,
  type TDensity,
  type TThemeTokens,
} from '@shinefold/config';

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
  headingWeight: THeadingWeight;
  headingCase: THeadingCase;
  imageProportion: TImageProportion;
  dividerWidth: TDividerWidth;
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
    headingWeight,
    headingCase,
    imageProportion,
    dividerWidth,
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
    headingWeight: row?.headingWeight ?? headingWeight,
    headingCase: row?.headingCase ?? headingCase,
    imageProportion: row?.imageProportion ?? imageProportion,
    dividerWidth: row?.dividerWidth ?? dividerWidth,
  };
};
