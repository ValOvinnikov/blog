import {
  BUTTON_SHAPE,
  COOKIE_SETTINGS_BUTTON,
  DENSITY,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  HEADER_CONTROL_SHAPE,
  HEADER_CONTROL_STYLE,
  RADIUS_SCALE,
  type TButtonShape,
  type TCookieSettingsButton,
  type TDensity,
  type TFooterLayout,
  type TFooterSurface,
  type THeaderControlShape,
  type THeaderControlStyle,
  type TRadiusScale,
} from '@blog/config';
import ButtonShapePill from '@platform/assets/look-glyphs/button-shape-pill.svg';
import ButtonShapeRounded from '@platform/assets/look-glyphs/button-shape-rounded.svg';
import ButtonShapeSquare from '@platform/assets/look-glyphs/button-shape-square.svg';
import CookieSettingsButtonHidden from '@platform/assets/look-glyphs/cookie-settings-button-hidden.svg';
import CookieSettingsButtonOnly from '@platform/assets/look-glyphs/cookie-settings-button-only.svg';
import CookieSettingsButtonShown from '@platform/assets/look-glyphs/cookie-settings-button-shown.svg';
import DensityCompact from '@platform/assets/look-glyphs/density-compact.svg';
import DensityDefault from '@platform/assets/look-glyphs/density-default.svg';
import FooterLayoutBigWordmark from '@platform/assets/look-glyphs/footer-layout-big-wordmark.svg';
import FooterLayoutCentred from '@platform/assets/look-glyphs/footer-layout-centred.svg';
import FooterLayoutColumns from '@platform/assets/look-glyphs/footer-layout-columns.svg';
import FooterLayoutCompact from '@platform/assets/look-glyphs/footer-layout-compact.svg';
import FooterSurfaceCard from '@platform/assets/look-glyphs/footer-surface-card.svg';
import FooterSurfaceFullWidth from '@platform/assets/look-glyphs/footer-surface-full-width.svg';
import HeaderControlShapeRound from '@platform/assets/look-glyphs/header-control-shape-round.svg';
import HeaderControlShapeRounded from '@platform/assets/look-glyphs/header-control-shape-rounded.svg';
import HeaderControlShapeSquare from '@platform/assets/look-glyphs/header-control-shape-square.svg';
import HeaderControlStyleOutlined from '@platform/assets/look-glyphs/header-control-style-outlined.svg';
import HeaderControlStylePlain from '@platform/assets/look-glyphs/header-control-style-plain.svg';
import HeaderControlStyleSoft from '@platform/assets/look-glyphs/header-control-style-soft.svg';
import RadiusScaleLg from '@platform/assets/look-glyphs/radius-scale-lg.svg';
import RadiusScaleMd from '@platform/assets/look-glyphs/radius-scale-md.svg';
import RadiusScaleNone from '@platform/assets/look-glyphs/radius-scale-none.svg';
import RadiusScaleSm from '@platform/assets/look-glyphs/radius-scale-sm.svg';
import RadiusScaleXl from '@platform/assets/look-glyphs/radius-scale-xl.svg';
import type { TGlyph } from '@platform/components/shared/icon';

type TLookOptionGlyphValues = {
  radiusScale: TRadiusScale;
  density: TDensity;
  headerControlStyle: THeaderControlStyle;
  headerControlShape: THeaderControlShape;
  buttonShape: TButtonShape;
  footerLayout: TFooterLayout;
  footerSurface: TFooterSurface;
  cookieSettingsButton: TCookieSettingsButton;
};

type TLookOptionGlyphRegistry = {
  [TField in keyof TLookOptionGlyphValues]: Record<
    TLookOptionGlyphValues[TField],
    TGlyph
  >;
};

export const LOOK_OPTION_GLYPH_REGISTRY: TLookOptionGlyphRegistry = {
  radiusScale: {
    [RADIUS_SCALE.NONE]: RadiusScaleNone,
    [RADIUS_SCALE.SM]: RadiusScaleSm,
    [RADIUS_SCALE.MD]: RadiusScaleMd,
    [RADIUS_SCALE.LG]: RadiusScaleLg,
    [RADIUS_SCALE.XL]: RadiusScaleXl,
  },
  density: {
    [DENSITY.DEFAULT]: DensityDefault,
    [DENSITY.COMPACT]: DensityCompact,
  },
  headerControlStyle: {
    [HEADER_CONTROL_STYLE.OUTLINED]: HeaderControlStyleOutlined,
    [HEADER_CONTROL_STYLE.SOFT]: HeaderControlStyleSoft,
    [HEADER_CONTROL_STYLE.PLAIN]: HeaderControlStylePlain,
  },
  headerControlShape: {
    [HEADER_CONTROL_SHAPE.ROUND]: HeaderControlShapeRound,
    [HEADER_CONTROL_SHAPE.ROUNDED]: HeaderControlShapeRounded,
    [HEADER_CONTROL_SHAPE.SQUARE]: HeaderControlShapeSquare,
  },
  buttonShape: {
    [BUTTON_SHAPE.SQUARE]: ButtonShapeSquare,
    [BUTTON_SHAPE.ROUNDED]: ButtonShapeRounded,
    [BUTTON_SHAPE.PILL]: ButtonShapePill,
  },
  footerLayout: {
    [FOOTER_LAYOUT.COLUMNS]: FooterLayoutColumns,
    [FOOTER_LAYOUT.CENTRED]: FooterLayoutCentred,
    [FOOTER_LAYOUT.COMPACT]: FooterLayoutCompact,
    [FOOTER_LAYOUT.BIG_WORDMARK]: FooterLayoutBigWordmark,
  },
  footerSurface: {
    [FOOTER_SURFACE.FULL_WIDTH]: FooterSurfaceFullWidth,
    [FOOTER_SURFACE.CARD]: FooterSurfaceCard,
  },
  cookieSettingsButton: {
    [COOKIE_SETTINGS_BUTTON.HIDDEN]: CookieSettingsButtonHidden,
    [COOKIE_SETTINGS_BUTTON.SHOWN]: CookieSettingsButtonShown,
    [COOKIE_SETTINGS_BUTTON.ONLY]: CookieSettingsButtonOnly,
  },
};

export type TLookOptionGlyphField = keyof TLookOptionGlyphValues;

export type TLookOptionGlyphValue<TField extends TLookOptionGlyphField> =
  TLookOptionGlyphValues[TField];
