import {
  BUTTON_SHAPE_DECLARATIONS,
  CARD_STYLE_DECLARATIONS,
  DENSITY_DECLARATIONS,
  DERIVED_RADIUS_DECLARATIONS,
  DIVIDER_WIDTH_DECLARATIONS,
  HEADER_CONTROL_SHAPE_DECLARATIONS,
  HEADER_CONTROL_STYLE,
  HEADER_CONTROL_STYLE_DECLARATIONS,
  HEADING_CASE_DECLARATIONS,
  HEADING_WEIGHT_DECLARATIONS,
  IMAGE_PROPORTION_DECLARATIONS,
  NAV_LINK_STYLE,
  NAV_LINK_STYLE_DECLARATIONS,
  RADIUS_DECLARATIONS,
  type TButtonShape,
  type TCardStyle,
  type TDensity,
  type TDividerWidth,
  type THeaderControlShape,
  type THeaderControlStyle,
  type THeadingCase,
  type THeadingWeight,
  type TImageProportion,
  type TMaybeUndefined,
  type TNavLinkStyle,
  type TRadiusScale,
  type TThemeDeclarations,
} from '@shinefold/config';

export type TShapePreviewValues = {
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

const buildSkinScopePreviewTokens = ({
  headerControlStyle,
  navLinkStyle,
}: Pick<
  TShapePreviewValues,
  'headerControlStyle' | 'navLinkStyle'
>): TThemeDeclarations => ({
  ...HEADER_CONTROL_STYLE_DECLARATIONS[headerControlStyle],
  ...NAV_LINK_STYLE_DECLARATIONS[navLinkStyle],
});

// theme.css already declares Outlined header buttons and Plain links in every skin scope.
export const buildSkinScopeOverrideTokens = (
  values: Pick<TShapePreviewValues, 'headerControlStyle' | 'navLinkStyle'>,
): TMaybeUndefined<TThemeDeclarations> =>
  values.headerControlStyle === HEADER_CONTROL_STYLE.OUTLINED &&
  values.navLinkStyle === NAV_LINK_STYLE.PLAIN
    ? undefined
    : buildSkinScopePreviewTokens(values);

export const buildShapePreviewTokens = ({
  radiusScale,
  density,
  cardStyle,
  headerControlStyle,
  headerControlShape,
  buttonShape,
  navLinkStyle,
  headingWeight,
  headingCase,
  imageProportion,
  dividerWidth,
}: TShapePreviewValues): TThemeDeclarations => {
  return {
    ...RADIUS_DECLARATIONS[radiusScale],
    ...DENSITY_DECLARATIONS[density],
    ...CARD_STYLE_DECLARATIONS[cardStyle],
    ...HEADER_CONTROL_SHAPE_DECLARATIONS[headerControlShape],
    ...BUTTON_SHAPE_DECLARATIONS[buttonShape],
    ...buildSkinScopePreviewTokens({ headerControlStyle, navLinkStyle }),
    ...HEADING_WEIGHT_DECLARATIONS[headingWeight],
    ...HEADING_CASE_DECLARATIONS[headingCase],
    ...IMAGE_PROPORTION_DECLARATIONS[imageProportion],
    ...DIVIDER_WIDTH_DECLARATIONS[dividerWidth],
    ...DERIVED_RADIUS_DECLARATIONS,
  };
};
