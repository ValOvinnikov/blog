import { formatHex, wcagContrast } from 'culori';

/** Converts an OKLCH triple (lightness, chroma, hue) to a hex color string. */
export function oklchToHex(l: number, c: number, h: number): string {
  return formatHex({ mode: 'oklch', l, c, h });
}

/** WCAG 2 AA contrast-ratio floor for normal text. */
export const WCAG_AA_CONTRAST_MIN = 4.5;

/** Computes the WCAG 2 contrast ratio between two OKLCH colors. */
export function wcagContrastRatio(
  a: { l: number; c: number; h: number },
  b: { l: number; c: number; h: number },
): number {
  return wcagContrast({ mode: 'oklch', ...a }, { mode: 'oklch', ...b });
}
