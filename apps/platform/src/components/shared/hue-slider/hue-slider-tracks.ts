import {
  HUE_SLIDER_TRACK,
  type THueSliderTrack,
} from '@platform/constants/hue-slider';
import { accentHueGradient } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import type { CSSProperties } from 'react';

const RAINBOW_STOPS = [
  '#ff0000',
  '#ff8000',
  '#ffff00',
  '#00c000',
  '#00c0c0',
  '#0060ff',
  '#8000ff',
  '#ff00c0',
  '#ff0000',
];

export const HUE_SLIDER_TRACK_STYLE: Record<THueSliderTrack, CSSProperties> = {
  [HUE_SLIDER_TRACK.PALETTE]: { background: accentHueGradient() },
  [HUE_SLIDER_TRACK.RAINBOW]: {
    background: `linear-gradient(90deg, ${RAINBOW_STOPS.join(', ')})`,
  },
};
