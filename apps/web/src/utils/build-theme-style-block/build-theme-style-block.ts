import {
  ACCENT_RAMP_DARK,
  ACCENT_RAMP_LIGHT,
  BRAND_PALETTE,
  BUTTON_SHAPE,
  BUTTON_SHAPE_DECLARATIONS,
  CARD_STYLE,
  CARD_STYLE_DECLARATIONS,
  DENSITY_DECLARATIONS,
  DIVIDER_WIDTH,
  DIVIDER_WIDTH_DECLARATIONS,
  formatOklchRamp,
  HEADER_CONTROL_SHAPE,
  HEADER_CONTROL_SHAPE_DECLARATIONS,
  HEADER_CONTROL_STYLE,
  HEADER_CONTROL_STYLE_DECLARATIONS,
  HEADING_CASE,
  HEADING_CASE_DECLARATIONS,
  HEADING_WEIGHT,
  HEADING_WEIGHT_DECLARATIONS,
  IMAGE_PROPORTION,
  IMAGE_PROPORTION_DECLARATIONS,
  IMAGE_SCRIM_RAMP,
  LOGO_RAMP_DARK,
  LOGO_RAMP_LIGHT,
  NAV_LINK_STYLE,
  NAV_LINK_STYLE_DECLARATIONS,
  RADIUS_DECLARATIONS,
  type TThemeDeclarations,
  type TThemeTokens,
} from '@shinefold/config';

const formatDeclarations = (declarations: TThemeDeclarations): string => {
  return Object.entries(declarations)
    .map(([property, value]) => `${property}: ${value};`)
    .join('\n    ');
};

/**
 * The site's runtime overrides for `configs/tailwind/theme.css` and
 * `skins.css`, whose static defaults must stay identical to the Console
 * preset's output so a site with no saved look renders the same.
 */
export const buildThemeStyleBlock = ({
  accentHue,
  logoHue,
  radiusScale,
  density,
  cardStyle = CARD_STYLE.ACCENT_BAR,
  headerControlStyle = HEADER_CONTROL_STYLE.OUTLINED,
  headerControlShape = HEADER_CONTROL_SHAPE.ROUND,
  buttonShape = BUTTON_SHAPE.ROUNDED,
  navLinkStyle = NAV_LINK_STYLE.PLAIN,
  headingWeight = HEADING_WEIGHT.MEDIUM,
  headingCase = HEADING_CASE.AS_WRITTEN,
  imageProportion = IMAGE_PROPORTION.AS_DESIGNED,
  dividerWidth = DIVIDER_WIDTH.HAIRLINE,
}: TThemeTokens): string => {
  const resolvedLogoHue = logoHue ?? accentHue;

  return `:root {
    ${formatDeclarations({
      ...formatOklchRamp(BRAND_PALETTE, accentHue),
      ...formatOklchRamp(ACCENT_RAMP_LIGHT, accentHue),
      ...formatOklchRamp(LOGO_RAMP_LIGHT, resolvedLogoHue),
      ...formatOklchRamp(IMAGE_SCRIM_RAMP, accentHue),
      ...RADIUS_DECLARATIONS[radiusScale],
      ...BUTTON_SHAPE_DECLARATIONS[buttonShape],
      ...DENSITY_DECLARATIONS[density],
      ...CARD_STYLE_DECLARATIONS[cardStyle],
      ...HEADER_CONTROL_STYLE_DECLARATIONS[headerControlStyle],
      ...HEADER_CONTROL_SHAPE_DECLARATIONS[headerControlShape],
      ...NAV_LINK_STYLE_DECLARATIONS[navLinkStyle],
      ...HEADING_WEIGHT_DECLARATIONS[headingWeight],
      ...HEADING_CASE_DECLARATIONS[headingCase],
      ...IMAGE_PROPORTION_DECLARATIONS[imageProportion],
      ...DIVIDER_WIDTH_DECLARATIONS[dividerWidth],
    })}
}
.dark {
    ${formatDeclarations({
      ...formatOklchRamp(ACCENT_RAMP_DARK, accentHue),
      ...formatOklchRamp(LOGO_RAMP_DARK, resolvedLogoHue),
    })}
}`;
};
