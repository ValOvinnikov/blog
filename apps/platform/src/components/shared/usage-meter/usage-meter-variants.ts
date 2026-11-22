import { METER_TONE } from '@platform/constants/meter';
import { tv } from '@platform/utils/tv/tv';

export const usageMeterVariants = tv({
  slots: {
    root: ['w-full'],
    track: ['block h-2 w-full overflow-hidden rounded-full bg-platform-line'],
    indicator: ['block h-full rounded-full'],
  },
  variants: {
    tone: {
      [METER_TONE.BRAND]: { indicator: ['bg-platform-brand'] },
      [METER_TONE.WARN]: { indicator: ['bg-platform-warn'] },
      [METER_TONE.BAD]: { indicator: ['bg-platform-bad'] },
    },
    isFull: {
      true: { indicator: ['rounded-none'] },
    },
  },
});
