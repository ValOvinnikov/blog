import { BRAND_VARIANTS, type TBrandVariants } from '@blog/config';
import { oklchToHex } from '@blog/utils';

type TLogoLayerColors = {
  layer1: string;
  layer2: string;
  layer3: string;
};

type TLogoPalette = {
  light: TLogoLayerColors;
  dark: TLogoLayerColors;
};

// Hex values are derived via `oklchToHex` from the `--logo-1/2/3` (Console)
// and `--logo-alt-1/2/3` (Indigo) OKLCH tokens in `configs/tailwind/theme.css`
// (light and dark modes respectively). `icon.tsx` can't read CSS custom
// properties server-side, so these OKLCH triples are duplicated here rather
// than read from `theme.css` — keep them in sync with `theme.css` if those
// tokens ever change.
const LOGO_PALETTES: Record<TBrandVariants, TLogoPalette> = {
  [BRAND_VARIANTS.CONSOLE]: {
    light: {
      layer1: oklchToHex(0.52, 0.17, 250),
      layer2: oklchToHex(0.63, 0.16, 250),
      layer3: oklchToHex(0.73, 0.13, 250),
    },
    dark: {
      layer1: oklchToHex(0.58, 0.17, 250),
      layer2: oklchToHex(0.68, 0.16, 250),
      layer3: oklchToHex(0.8, 0.14, 250),
    },
  },
  [BRAND_VARIANTS.INDIGO]: {
    light: {
      layer1: oklchToHex(0.47, 0.24, 274),
      layer2: oklchToHex(0.58, 0.21, 274),
      layer3: oklchToHex(0.72, 0.14, 274),
    },
    dark: {
      layer1: oklchToHex(0.52, 0.24, 274),
      layer2: oklchToHex(0.64, 0.2, 274),
      layer3: oklchToHex(0.78, 0.13, 274),
    },
  },
};

/**
 * Builds the brand mark favicon as a raw SVG string, recolored for the given
 * `brand.variant` — same viewBox/polygon shapes and embedded
 * `prefers-color-scheme` media query as the static icon it replaces (that
 * light/dark switch stays entirely client-evaluated; only the four fill
 * constants per mode differ by variant), so the browser — not this
 * server-rendered route — still decides light vs dark at request time.
 *
 * @example
 * buildBrandIconSvg(BRAND_VARIANTS.INDIGO) // '<svg ...>...</svg>' with Indigo fills
 */
export function buildBrandIconSvg(variant: TBrandVariants): string {
  const { light, dark } =
    LOGO_PALETTES[variant] ?? LOGO_PALETTES[BRAND_VARIANTS.CONSOLE];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <style>
    .layer-1 { fill: ${light.layer1}; }
    .layer-2 { fill: ${light.layer2}; }
    .layer-3 { fill: ${light.layer3}; }
    @media (prefers-color-scheme: dark) {
      .layer-1 { fill: ${dark.layer1}; }
      .layer-2 { fill: ${dark.layer2}; }
      .layer-3 { fill: ${dark.layer3}; }
    }
  </style>
  <polygon class="layer-1" points="12,3 22,7 12,11 2,7" />
  <polygon class="layer-2" points="12,8 22,12 12,16 2,12" />
  <polygon class="layer-3" points="12,13 22,17 12,21 2,17" />
</svg>`;
}
