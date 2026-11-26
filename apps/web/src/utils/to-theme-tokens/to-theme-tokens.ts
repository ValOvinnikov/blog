import {
  isAccentHueAccessible,
  PRESET_ID,
  PRESET_REGISTRY,
  type TMaybeUndefined,
  type TPresetId,
  type TThemeTokens,
} from '@shinefold/config';

export type TSiteThemeTokens = TThemeTokens & {
  preset?: TPresetId;
  buttonColor?: string;
  buttonColorDark?: string;
};

type TThemeTokensRow = TSiteThemeTokens & { preset: TPresetId };

export const toThemeTokens = (
  row: TMaybeUndefined<TThemeTokensRow>,
): TSiteThemeTokens => {
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
    preset,
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
    buttonColor: row?.buttonColor,
    buttonColorDark: row?.buttonColorDark,
  };
};
