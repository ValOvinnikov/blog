import { BRAND_VARIANTS, type TBrandVariants } from '@blog/config';

type TLogoLayerColors = {
  layer1: string;
  layer2: string;
  layer3: string;
};

type TLogoPalette = {
  light: TLogoLayerColors;
  dark: TLogoLayerColors;
};

// Hex values are the sRGB conversions of the `--logo-1/2/3` (Console) and
// `--logo-alt-1/2/3` (Indigo) OKLCH tokens in `configs/tailwind/theme.css`
// (light and dark modes respectively). `icon.tsx` can't read CSS custom
// properties server-side, so these are duplicated here rather than derived —
// keep them in sync with `theme.css` if those tokens ever change.
const LOGO_PALETTES: Record<TBrandVariants, TLogoPalette> = {
  [BRAND_VARIANTS.CONSOLE]: {
    light: { layer1: '#006ac5', layer2: '#288de5', layer3: '#63adf6' },
    dark: { layer1: '#007cd9', layer2: '#3b9cf6', layer3: '#73c3ff' },
  },
  [BRAND_VARIANTS.INDIGO]: {
    light: { layer1: '#3e36dd', layer2: '#5966f3', layer3: '#8a9cfc' },
    dark: { layer1: '#4849ef', layer2: '#6a7bff', layer3: '#9eb0ff' },
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
