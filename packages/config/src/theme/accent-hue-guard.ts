import { renderedContrastRatio, WCAG_AA_CONTRAST_MIN } from '@blog/utils/color';

import { ACCENT_RAMP_DARK, ACCENT_RAMP_LIGHT } from './theme-declarations';
import { NEUTRAL_RAMP_DARK, NEUTRAL_RAMP_LIGHT } from './theme-ramps';

export const isAccentHueAccessible = (hue: number): boolean => {
  const light = renderedContrastRatio(NEUTRAL_RAMP_LIGHT['--text'], [
    { ...ACCENT_RAMP_LIGHT['--brand-primary-muted'], h: hue },
  ]);
  const dark = renderedContrastRatio(NEUTRAL_RAMP_DARK['--text'], [
    { ...ACCENT_RAMP_DARK['--brand-primary-muted'], h: hue },
  ]);
  return light >= WCAG_AA_CONTRAST_MIN && dark >= WCAG_AA_CONTRAST_MIN;
};
