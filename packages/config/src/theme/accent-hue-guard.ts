import { WCAG_AA_CONTRAST_MIN, wcagContrastRatio } from '@blog/utils/color';

// Fixed L/C for --text and --brand-primary-muted (configs/tailwind/theme.css) —
// only hue rotates per accentHue, so this is the pairing the WCAG guard below checks.
const TEXT_LIGHT = { l: 0.2, c: 0.01, h: 250 };
const TEXT_DARK = { l: 0.95, c: 0.004, h: 250 };
const BRAND_PRIMARY_MUTED_LIGHT_LC = { l: 0.95, c: 0.03 };
const BRAND_PRIMARY_MUTED_DARK_LC = { l: 0.3, c: 0.06 };

/**
 * Checks whether a tenant's accent hue keeps `--text` readable against
 * `--brand-primary-muted` in both light and dark mode, per WCAG AA.
 */
export const isAccentHueAccessible = (hue: number): boolean => {
  const light = wcagContrastRatio(TEXT_LIGHT, {
    ...BRAND_PRIMARY_MUTED_LIGHT_LC,
    h: hue,
  });
  const dark = wcagContrastRatio(TEXT_DARK, {
    ...BRAND_PRIMARY_MUTED_DARK_LC,
    h: hue,
  });
  return light >= WCAG_AA_CONTRAST_MIN && dark >= WCAG_AA_CONTRAST_MIN;
};
