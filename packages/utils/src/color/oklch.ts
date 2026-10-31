import {
  clampRgb,
  converter,
  formatHex,
  type Rgb,
  toGamut,
  wcagContrast,
} from 'culori';

export function oklchToHex(l: number, c: number, h: number): string {
  return formatHex({ mode: 'oklch', l, c, h });
}

export function hexToOklch(hex: string): TOklchColor {
  const color = toOklch(hex);
  if (!color) throw new Error(`Not a hex colour: ${hex}`);

  return { l: color.l, c: color.c, h: color.h ?? 0 };
}

/** WCAG 2 AA contrast-ratio floor for normal text. */
export const WCAG_AA_CONTRAST_MIN = 4.5;

export type TOklchColor = { l: number; c: number; h: number; alpha?: number };

type TToSrgb = (color: TOklchColor) => Rgb;

const toRgb = converter('rgb');
const toOklch = converter('oklch');
const mapToSrgbGamut = toGamut('rgb', 'oklch');

const memoizeByColor = (toSrgb: TToSrgb): TToSrgb => {
  const cache = new Map<string, Rgb>();

  return (color) => {
    const key = `${color.l} ${color.c} ${color.h}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const rgb = toSrgb(color);
    cache.set(key, rgb);
    return rgb;
  };
};

const GAMUT_STRATEGIES: readonly TToSrgb[] = [
  memoizeByColor(({ l, c, h }) =>
    toRgb(mapToSrgbGamut({ mode: 'oklch', l, c, h })),
  ),
  memoizeByColor(({ l, c, h }) => clampRgb(toRgb({ mode: 'oklch', l, c, h }))),
];

function compositeLayers(layers: readonly TOklchColor[], toSrgb: TToSrgb): Rgb {
  return layers.reduce<Rgb>(
    (below, layer) => {
      const { r, g, b } = toSrgb(layer);
      const alpha = layer.alpha ?? 1;

      return {
        mode: 'rgb',
        r: r * alpha + below.r * (1 - alpha),
        g: g * alpha + below.g * (1 - alpha),
        b: b * alpha + below.b * (1 - alpha),
      };
    },
    { mode: 'rgb', r: 0, g: 0, b: 0 },
  );
}

/**
 * Contrast as a browser could paint it: browsers differ in how they bring an
 * out-of-gamut OKLCH colour into sRGB, so this is the worse of CSS Color 4
 * gamut mapping and per-channel clipping. `backgroundLayers` stack bottom
 * first, over black.
 */
export function renderedContrastRatio(
  foreground: TOklchColor,
  backgroundLayers: readonly TOklchColor[],
): number {
  return Math.min(
    ...GAMUT_STRATEGIES.map((toSrgb) =>
      wcagContrast(
        compositeLayers([...backgroundLayers, foreground], toSrgb),
        compositeLayers(backgroundLayers, toSrgb),
      ),
    ),
  );
}
