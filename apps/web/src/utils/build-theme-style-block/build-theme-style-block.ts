import {
  ACCENT_RAMP_DARK,
  ACCENT_RAMP_LIGHT,
  CARD_STYLE,
  CARD_STYLE_DECLARATIONS,
  DENSITY_DECLARATIONS,
  formatOklchRamp,
  LOGO_RAMP_DARK,
  LOGO_RAMP_LIGHT,
  RADIUS_DECLARATIONS,
  type TThemeDeclarations,
  type TThemeTokens,
} from '@blog/config';

const formatDeclarations = (declarations: TThemeDeclarations): string => {
  return Object.entries(declarations)
    .map(([property, value]) => `${property}: ${value};`)
    .join('\n    ');
};

/**
 * The site's runtime overrides for `configs/tailwind/theme.css`, whose static
 * defaults must stay identical to the Console preset's output so a site with
 * no saved look renders the same.
 */
export const buildThemeStyleBlock = ({
  accentHue,
  logoHue,
  radiusScale,
  density,
  cardStyle = CARD_STYLE.ACCENT_BAR,
}: TThemeTokens): string => {
  const resolvedLogoHue = logoHue ?? accentHue;

  return `:root {
    ${formatDeclarations({
      ...formatOklchRamp(ACCENT_RAMP_LIGHT, accentHue),
      ...formatOklchRamp(LOGO_RAMP_LIGHT, resolvedLogoHue),
      ...RADIUS_DECLARATIONS[radiusScale],
      ...DENSITY_DECLARATIONS[density],
      ...CARD_STYLE_DECLARATIONS[cardStyle],
    })}
}
.dark {
    ${formatDeclarations({
      ...formatOklchRamp(ACCENT_RAMP_DARK, accentHue),
      ...formatOklchRamp(LOGO_RAMP_DARK, resolvedLogoHue),
    })}
}`;
};
