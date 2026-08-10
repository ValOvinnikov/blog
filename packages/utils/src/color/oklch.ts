import { formatHex } from 'culori';

/** Converts an OKLCH triple (lightness, chroma, hue) to a hex color string. */
export function oklchToHex(l: number, c: number, h: number): string {
  return formatHex({ mode: 'oklch', l, c, h });
}
