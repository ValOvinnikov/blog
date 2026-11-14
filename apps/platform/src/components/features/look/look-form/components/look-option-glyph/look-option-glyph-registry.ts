import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BUTTON_SHAPE,
  DENSITY,
  HEADER_CONTROL_SHAPE,
  HEADER_CONTROL_STYLE,
  RADIUS_SCALE,
  type TAccountButtonStyle,
  type TAccountPanelStyle,
  type TAccountPhonePlacement,
  type TButtonShape,
  type TDensity,
  type THeaderControlShape,
  type THeaderControlStyle,
  type TRadiusScale,
} from '@blog/config';
import AccountButtonStyleCircle from '@platform/assets/look-glyphs/account-button-style-circle.svg';
import AccountButtonStylePill from '@platform/assets/look-glyphs/account-button-style-pill.svg';
import AccountPanelStyleCard from '@platform/assets/look-glyphs/account-panel-style-card.svg';
import AccountPanelStyleHub from '@platform/assets/look-glyphs/account-panel-style-hub.svg';
import AccountPanelStyleProfile from '@platform/assets/look-glyphs/account-panel-style-profile.svg';
import AccountPhonePlacementBar from '@platform/assets/look-glyphs/account-phone-placement-bar.svg';
import AccountPhonePlacementMenu from '@platform/assets/look-glyphs/account-phone-placement-menu.svg';
import ButtonShapePill from '@platform/assets/look-glyphs/button-shape-pill.svg';
import ButtonShapeRounded from '@platform/assets/look-glyphs/button-shape-rounded.svg';
import ButtonShapeSquare from '@platform/assets/look-glyphs/button-shape-square.svg';
import DensityCompact from '@platform/assets/look-glyphs/density-compact.svg';
import DensityDefault from '@platform/assets/look-glyphs/density-default.svg';
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
  accountButtonStyle: TAccountButtonStyle;
  accountPanelStyle: TAccountPanelStyle;
  accountPhonePlacement: TAccountPhonePlacement;
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
  accountButtonStyle: {
    [ACCOUNT_BUTTON_STYLE.PILL]: AccountButtonStylePill,
    [ACCOUNT_BUTTON_STYLE.CIRCLE]: AccountButtonStyleCircle,
  },
  accountPanelStyle: {
    [ACCOUNT_PANEL_STYLE.CARD]: AccountPanelStyleCard,
    [ACCOUNT_PANEL_STYLE.PROFILE]: AccountPanelStyleProfile,
    [ACCOUNT_PANEL_STYLE.HUB]: AccountPanelStyleHub,
  },
  accountPhonePlacement: {
    [ACCOUNT_PHONE_PLACEMENT.BAR]: AccountPhonePlacementBar,
    [ACCOUNT_PHONE_PLACEMENT.MENU]: AccountPhonePlacementMenu,
  },
};

export type TLookOptionGlyphField = keyof TLookOptionGlyphValues;

export type TLookOptionGlyphValue<TField extends TLookOptionGlyphField> =
  TLookOptionGlyphValues[TField];
