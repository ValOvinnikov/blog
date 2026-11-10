import {
  BUTTON_SHAPE,
  DENSITY,
  HEADER_CONTROL_STYLE,
  RADIUS_SCALE,
  type TButtonShape,
  type TDensity,
  type THeaderControlStyle,
  type TRadiusScale,
} from '@blog/config';
import ButtonShapePill from '@platform/assets/look-glyphs/button-shape-pill.svg';
import ButtonShapeRounded from '@platform/assets/look-glyphs/button-shape-rounded.svg';
import ButtonShapeSquare from '@platform/assets/look-glyphs/button-shape-square.svg';
import DensityCompact from '@platform/assets/look-glyphs/density-compact.svg';
import DensityDefault from '@platform/assets/look-glyphs/density-default.svg';
import HeaderControlStyleOutlined from '@platform/assets/look-glyphs/header-control-style-outlined.svg';
import HeaderControlStylePlain from '@platform/assets/look-glyphs/header-control-style-plain.svg';
import HeaderControlStyleSoft from '@platform/assets/look-glyphs/header-control-style-soft.svg';
import RadiusScaleLg from '@platform/assets/look-glyphs/radius-scale-lg.svg';
import RadiusScaleMd from '@platform/assets/look-glyphs/radius-scale-md.svg';
import RadiusScaleSm from '@platform/assets/look-glyphs/radius-scale-sm.svg';
import RadiusScaleXl from '@platform/assets/look-glyphs/radius-scale-xl.svg';
import type { TGlyph } from '@platform/components/shared/icon';

type TLookOptionGlyphValues = {
  radiusScale: TRadiusScale;
  density: TDensity;
  headerControlStyle: THeaderControlStyle;
  buttonShape: TButtonShape;
};

type TLookOptionGlyphRegistry = {
  [TField in keyof TLookOptionGlyphValues]: Record<
    TLookOptionGlyphValues[TField],
    TGlyph
  >;
};

export const LOOK_OPTION_GLYPH_REGISTRY: TLookOptionGlyphRegistry = {
  radiusScale: {
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
  buttonShape: {
    [BUTTON_SHAPE.SQUARE]: ButtonShapeSquare,
    [BUTTON_SHAPE.ROUNDED]: ButtonShapeRounded,
    [BUTTON_SHAPE.PILL]: ButtonShapePill,
  },
};

export type TLookOptionGlyphField = keyof TLookOptionGlyphValues;

export type TLookOptionGlyphValue<TField extends TLookOptionGlyphField> =
  TLookOptionGlyphValues[TField];
