import type { TButtonShape } from './button-shape';
import type { TCardStyle } from './card-style';
import type { TDividerWidth } from './divider-width';
import type { THeaderControlShape } from './header-control-shape';
import type { THeaderControlStyle } from './header-control-style';
import type { THeadingCase, THeadingWeight } from './heading-style';
import type { TImageProportion } from './image-proportion';
import type { TNavLinkStyle } from './nav-link-style';
import type { TDensity, TFontChoice, TRadiusScale } from './preset';

export type TThemeTokens = {
  accentHue: number;
  logoHue?: number;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  radiusScale: TRadiusScale;
  density: TDensity;
  cardStyle?: TCardStyle;
  headerControlStyle?: THeaderControlStyle;
  headerControlShape?: THeaderControlShape;
  buttonShape?: TButtonShape;
  navLinkStyle?: TNavLinkStyle;
  headingWeight?: THeadingWeight;
  headingCase?: THeadingCase;
  imageProportion?: TImageProportion;
  dividerWidth?: TDividerWidth;
};
