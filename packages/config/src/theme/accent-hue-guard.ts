import { WCAG_AA_CONTRAST_MIN, wcagContrastRatio } from '@blog/utils/color';

import { ACCENT_RAMP_DARK, ACCENT_RAMP_LIGHT } from './theme-declarations';

// --text's fixed values in configs/tailwind/theme.css, which no tenant setting rotates.
const TEXT_LIGHT = { l: 0.2, c: 0.01, h: 250 };
const TEXT_DARK = { l: 0.95, c: 0.004, h: 250 };

export const isAccentHueAccessible = (hue: number): boolean => {
  const light = wcagContrastRatio(TEXT_LIGHT, {
    ...ACCENT_RAMP_LIGHT['--brand-primary-muted'],
    h: hue,
  });
  const dark = wcagContrastRatio(TEXT_DARK, {
    ...ACCENT_RAMP_DARK['--brand-primary-muted'],
    h: hue,
  });
  return light >= WCAG_AA_CONTRAST_MIN && dark >= WCAG_AA_CONTRAST_MIN;
};
