import { formatHex, wcagContrast } from 'culori';

export function oklchToHex(l: number, c: number, h: number): string {
  return formatHex({ mode: 'oklch', l, c, h });
}

/** WCAG 2 AA contrast-ratio floor for normal text. */
export const WCAG_AA_CONTRAST_MIN = 4.5;

export function wcagContrastRatio(
  a: { l: number; c: number; h: number },
  b: { l: number; c: number; h: number },
): number {
  return wcagContrast({ mode: 'oklch', ...a }, { mode: 'oklch', ...b });
}
