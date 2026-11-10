import type { TButtonShape } from './button-shape';
import type { TCardStyle } from './card-style';
import type { THeaderControlStyle } from './header-control-style';
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
  buttonShape?: TButtonShape;
  navLinkStyle?: TNavLinkStyle;
};
