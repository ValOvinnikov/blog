import type { TValueOf } from '@blog/config/utils';

export const HUE_SLIDER_TRACK = {
  PALETTE: 'PALETTE',
  RAINBOW: 'RAINBOW',
} as const;

export type THueSliderTrack = TValueOf<typeof HUE_SLIDER_TRACK>;
