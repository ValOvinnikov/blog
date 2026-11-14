import {
  FOCUS_RING_GROUND,
  FOCUS_RING_TRIGGER,
} from '@platform/constants/focus-ring';
import { HUE_SLIDER_TRACK } from '@platform/constants/hue-slider';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const hueSliderVariants = tv({
  slots: {
    root: ['min-w-24 flex-1 self-stretch touch-none select-none'],
    control: ['flex h-full min-h-11 items-center md:min-h-9'],
    track: [
      'relative w-full grow bg-platform-line-2',
      'data-[disabled]:opacity-50',
    ],
    thumb: [
      'block size-5 rounded-full bg-white',
      'border border-platform-thumb-line shadow-platform-thumb',
      'transition-colors',
      focusRingClasses(
        FOCUS_RING_GROUND.SURFACE,
        FOCUS_RING_TRIGGER.INNER_FOCUS_VISIBLE,
      ),
    ],
  },
  variants: {
    track: {
      [HUE_SLIDER_TRACK.PALETTE]: {
        track: ['h-2.5 rounded-full inset-ring inset-ring-platform-thumb-line'],
      },
      [HUE_SLIDER_TRACK.RAINBOW]: { track: ['h-3 rounded-platform'] },
    },
  },
  defaultVariants: { track: HUE_SLIDER_TRACK.PALETTE },
});
