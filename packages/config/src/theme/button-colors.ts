import {
  hexToOklch,
  isHexColor,
  oklchToHex,
  renderedContrastRatio,
  type TOklchColor,
} from '@shinefold/utils/color';

import { COLOR_SCHEME, type TColorScheme } from '@shinefold/config/constants';

import { ACCENT_RAMP_DARK, ACCENT_RAMP_LIGHT } from './accent-ramps';
import {
  BRAND_PRIMARY_SOLID,
  BRAND_PRIMARY_SOLID_HOVER,
} from './contrast-surfaces';
import { ACHROMATIC_PALETTE } from './palette-ramps';

export type TButtonColorInput = {
  color: string;
  darkGroundColor?: string;
};

export type TButtonColors = { fill: string; fillHover: string; label: string };

export type TButtonColorsByGround = Record<TColorScheme, TButtonColors>;

const WHITE_LABEL = ACHROMATIC_PALETTE['--palette-achromatic-100'];

// Dark enough that white or this label clears 4.5:1 on any fill, mid-grey included.
const NEAR_BLACK_LABEL: TOklchColor = { l: 0.08, c: 0, h: 0 };

const HOVER_LIGHTNESS_SHIFT =
  ACCENT_RAMP_LIGHT[BRAND_PRIMARY_SOLID].l -
  ACCENT_RAMP_LIGHT[BRAND_PRIMARY_SOLID_HOVER].l;

const DARK_GROUND_MIN_LIGHTNESS = ACCENT_RAMP_DARK[BRAND_PRIMARY_SOLID].l;

const toHex = ({ l, c, h }: TOklchColor): string => oklchToHex(l, c, h);

const parseHex = (value: string): TOklchColor => {
  if (!isHexColor(value)) {
    throw new Error(`Not a 6-digit hex colour: ${value}`);
  }
  return hexToOklch(value);
};

const labelFor = (fill: TOklchColor): TOklchColor =>
  renderedContrastRatio(WHITE_LABEL, [fill]) >=
  renderedContrastRatio(NEAR_BLACK_LABEL, [fill])
    ? WHITE_LABEL
    : NEAR_BLACK_LABEL;

const hoverOf = (fill: TOklchColor, label: TOklchColor): TOklchColor => {
  const shift =
    label === WHITE_LABEL ? -HOVER_LIGHTNESS_SHIFT : HOVER_LIGHTNESS_SHIFT;
  const shifted = fill.l + shift;
  const l = shifted >= 0 && shifted <= 1 ? shifted : fill.l - shift;
  return { ...fill, l };
};

const colorsOf = (fill: TOklchColor, fillHex: string): TButtonColors => {
  const label = labelFor(fill);
  return {
    fill: fillHex.toLowerCase(),
    fillHover: toHex(hoverOf(fill, label)),
    label: toHex(label),
  };
};

const darkGroundHexOf = (light: TOklchColor, color: string): string =>
  light.l >= DARK_GROUND_MIN_LIGHTNESS
    ? color
    : toHex({ ...light, l: DARK_GROUND_MIN_LIGHTNESS });

export const deriveButtonColors = ({
  color,
  darkGroundColor,
}: TButtonColorInput): TButtonColorsByGround => {
  const light = parseHex(color);
  const darkHex = darkGroundColor || darkGroundHexOf(light, color);

  return {
    [COLOR_SCHEME.LIGHT]: colorsOf(light, color),
    [COLOR_SCHEME.DARK]: colorsOf(parseHex(darkHex), darkHex),
  };
};
