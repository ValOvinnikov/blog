import { SliderRange } from './components/range/slider-range';
import { SliderThumb } from './components/thumb/slider-thumb';
import { SliderTrack } from './components/track/slider-track';

export type { ISliderRangeProps } from './components/range/slider-range';
export type { ISliderThumbProps } from './components/thumb/slider-thumb';
export type { ISliderTrackProps } from './components/track/slider-track';

/**
 * SliderShell — the visual pieces of a single-value slider (a track, a
 * filled range, and a draggable thumb), each independently rendered as its
 * own `render`-prop target for a headless behavior library (e.g. Base UI's
 * `Slider.Control`/`Slider.Indicator`/`Slider.Thumb`). Neither positions nor
 * drives the others — the behavior library composes and drives all three.
 */
export const SliderShell = {
  Track: SliderTrack,
  Range: SliderRange,
  Thumb: SliderThumb,
};
