import type { TMaybeNull } from '@blog/config';

import type { TEdgeTarget } from './collect-edge-targets';
import type { TTextTarget } from './collect-text-targets';
import type { TBox, TRgba } from './contrast-probe';
import type { TPixels } from './decode-png';

const MIN_TEXT_RATIO = 4.5;
const MIN_LARGE_TEXT_RATIO = 3;
const MIN_NON_TEXT_RATIO = 3;

const SAMPLE_STEP = 2;
// Ignores anti-aliased slivers of a neighbouring edge that share a text box.
const OUTLIER_SHARE = 0.02;
const EDGE_BAND_OFFSET = 2;
const EDGE_BAND_DEPTH = 3;

type TRgb = [number, number, number];

const toLinear = (channel: number): number => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = ([red, green, blue]: TRgb): number =>
  0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);

const contrastRatio = (first: TRgb, second: TRgb): number => {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
};

const composite = ([red, green, blue, alpha]: TRgba, backdrop: TRgb): TRgb => [
  red * alpha + backdrop[0] * (1 - alpha),
  green * alpha + backdrop[1] * (1 - alpha),
  blue * alpha + backdrop[2] * (1 - alpha),
];

const pixelAt = ({ width, height, rgb }: TPixels, x: number, y: number) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  const index = (y * width + x) * 3;
  return [rgb[index], rgb[index + 1], rgb[index + 2]] as TRgb;
};

const worstRatio = (
  pixels: TPixels,
  color: TRgba,
  points: [number, number][],
): TMaybeNull<number> => {
  const ratios = points.flatMap(([x, y]) => {
    const backdrop = pixelAt(pixels, x, y);
    return backdrop
      ? [contrastRatio(composite(color, backdrop), backdrop)]
      : [];
  });
  if (ratios.length === 0) return null;
  ratios.sort((a, b) => a - b);
  return ratios[Math.floor(ratios.length * OUTLIER_SHARE)] ?? null;
};

const insidePoints = ({ x, y, width, height }: TBox): [number, number][] => {
  const points: [number, number][] = [];
  for (let row = y; row < y + height; row += SAMPLE_STEP) {
    for (let column = x; column < x + width; column += SAMPLE_STEP) {
      points.push([column, row]);
    }
  }
  return points;
};

const bandPoints = ({ x, y, width, height }: TBox): [number, number][] => {
  const points: [number, number][] = [];
  for (
    let depth = EDGE_BAND_OFFSET;
    depth < EDGE_BAND_OFFSET + EDGE_BAND_DEPTH;
    depth++
  ) {
    for (let column = x; column < x + width; column += SAMPLE_STEP) {
      points.push([column, y - depth], [column, y + height - 1 + depth]);
    }
    for (let row = y; row < y + height; row += SAMPLE_STEP) {
      points.push([x - depth, row], [x + width - 1 + depth, row]);
    }
  }
  return points;
};

export type TMeasurement = {
  path: string;
  snippet: string;
  ratio: number;
  minimum: number;
};

export const measureText = (
  pixels: TPixels,
  { path, snippet, boxes, color, isLarge }: TTextTarget,
): TMaybeNull<TMeasurement> => {
  const ratio = worstRatio(pixels, color, boxes.flatMap(insidePoints));
  const minimum = isLarge ? MIN_LARGE_TEXT_RATIO : MIN_TEXT_RATIO;
  return ratio === null ? null : { path, snippet, ratio, minimum };
};

export const measureEdge = (
  pixels: TPixels,
  { path, snippet, box, color }: TEdgeTarget,
): TMaybeNull<TMeasurement> => {
  const ratio = worstRatio(pixels, color, bandPoints(box));
  return ratio === null
    ? null
    : { path, snippet, ratio, minimum: MIN_NON_TEXT_RATIO };
};
