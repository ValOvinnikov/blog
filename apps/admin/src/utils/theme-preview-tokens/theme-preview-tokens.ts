export type TAccentPreviewTokens = {
  '--brand-primary': string;
  '--brand-primary-hover': string;
  '--brand-primary-muted': string;
  '--brand-primary-contrast': string;
  '--brand-primary-solid': string;
  '--brand-primary-solid-hover': string;
};

export type TLogoPreviewTokens = {
  '--logo-1': string;
  '--logo-2': string;
  '--logo-3': string;
};

const HUE_MIN = 0;
const HUE_MAX = 360;
const HUE_GRADIENT_STEP = 20;

/**
 * Mirrors `apps/web/src/utils/build-theme-style-block.ts`'s exact OKLCH ramp
 * — only the hue channel varies, lightness/chroma are fixed for verified
 * WCAG contrast — so this preview shows the colors the real site will
 * actually render, not an approximation. `--brand-primary-contrast` is
 * achromatic by design and never varies with hue.
 */
export const buildAccentPreviewTokens = (
  hue: number,
  isDark: boolean,
): TAccentPreviewTokens => {
  if (isDark) {
    return {
      '--brand-primary': `oklch(0.7 0.16 ${hue})`,
      '--brand-primary-hover': `oklch(0.76 0.16 ${hue})`,
      '--brand-primary-muted': `oklch(0.3 0.06 ${hue})`,
      '--brand-primary-contrast': 'oklch(0.16 0.006 250)',
      '--brand-primary-solid': `oklch(0.7 0.16 ${hue})`,
      '--brand-primary-solid-hover': `oklch(0.76 0.16 ${hue})`,
    };
  }

  return {
    '--brand-primary': `oklch(0.53 0.17 ${hue})`,
    '--brand-primary-hover': `oklch(0.47 0.17 ${hue})`,
    '--brand-primary-muted': `oklch(0.95 0.03 ${hue})`,
    '--brand-primary-contrast': 'oklch(0.99 0 0)',
    '--brand-primary-solid': `oklch(0.55 0.17 ${hue})`,
    '--brand-primary-solid-hover': `oklch(0.49 0.17 ${hue})`,
  };
};

/** Same source ramp as `buildAccentPreviewTokens`, for `--logo-1/2/3` only. */
export const buildLogoPreviewTokens = (
  hue: number,
  isDark: boolean,
): TLogoPreviewTokens => {
  if (isDark) {
    return {
      '--logo-1': `oklch(0.58 0.17 ${hue})`,
      '--logo-2': `oklch(0.68 0.16 ${hue})`,
      '--logo-3': `oklch(0.8 0.14 ${hue})`,
    };
  }

  return {
    '--logo-1': `oklch(0.52 0.17 ${hue})`,
    '--logo-2': `oklch(0.63 0.16 ${hue})`,
    '--logo-3': `oklch(0.73 0.13 ${hue})`,
  };
};

/**
 * The accent-hue slider's track gradient, sampled from the same light-mode
 * formula as the swatch it drives — so the track only ever shows colors the
 * slider can actually select, independent of the preview panel's own
 * light/dark toggle.
 */
export const accentHueGradient = (): string => {
  const stops: string[] = [];

  for (let hue = HUE_MIN; hue <= HUE_MAX; hue += HUE_GRADIENT_STEP) {
    stops.push(`oklch(0.53 0.17 ${hue})`);
  }

  return `linear-gradient(90deg, ${stops.join(', ')})`;
};
