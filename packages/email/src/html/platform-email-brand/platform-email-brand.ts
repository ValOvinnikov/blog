import { oklchToHex } from '@blog/utils/color';

// Email clients can't read CSS custom properties, so these mirror
// `configs/tailwind/theme.css`'s light-mode `:root` OKLCH values as static
// hex, computed once at module load rather than duplicated as hand-copied
// hex literals that could drift from the source tokens unnoticed.
export const PLATFORM_EMAIL_BRAND = {
  surface: oklchToHex(1, 0, 0),
  surface2: oklchToHex(0.975, 0.003, 250),
  border: oklchToHex(0.9, 0.004, 250),
  text: oklchToHex(0.2, 0.01, 250),
  textMuted: oklchToHex(0.46, 0.01, 250),
  brandPrimary: oklchToHex(0.53, 0.17, 250),
  brandPrimarySolid: oklchToHex(0.55, 0.17, 250),
  brandPrimaryContrast: oklchToHex(0.99, 0, 0),
  logo1: oklchToHex(0.52, 0.17, 250),
  logo2: oklchToHex(0.63, 0.16, 250),
  logo3: oklchToHex(0.73, 0.13, 250),
} as const;
