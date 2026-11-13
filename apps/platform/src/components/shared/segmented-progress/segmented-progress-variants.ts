import { STEP_INDICATOR_STATE } from '@platform/constants/step-indicator';
import { tv } from '@platform/utils/tv/tv';

export const segmentedProgressVariants = tv({
  slots: {
    root: ['flex flex-col gap-2.5'],
    label: ['text-platform-13 font-semibold'],
    track: ['flex gap-1.5'],
    segment: ['h-1 flex-1 rounded-platform-bar'],
  },
  variants: {
    isOnDark: {
      true: { label: ['text-platform-rail-text'] },
      false: { label: ['text-platform-muted'] },
    },
    state: {
      [STEP_INDICATOR_STATE.DONE]: {},
      [STEP_INDICATOR_STATE.ACTIVE]: {},
      [STEP_INDICATOR_STATE.UPCOMING]: {},
    },
  },
  compoundVariants: [
    {
      isOnDark: false,
      state: [STEP_INDICATOR_STATE.DONE, STEP_INDICATOR_STATE.ACTIVE],
      class: { segment: ['bg-platform-brand'] },
    },
    {
      isOnDark: false,
      state: STEP_INDICATOR_STATE.UPCOMING,
      class: { segment: ['bg-platform-line-2'] },
    },
    {
      isOnDark: true,
      state: STEP_INDICATOR_STATE.DONE,
      class: { segment: ['bg-platform-rail-accent'] },
    },
    {
      isOnDark: true,
      state: STEP_INDICATOR_STATE.ACTIVE,
      class: { segment: ['bg-white'] },
    },
    {
      isOnDark: true,
      state: STEP_INDICATOR_STATE.UPCOMING,
      class: { segment: ['bg-platform-rail-raised'] },
    },
  ],
  defaultVariants: { isOnDark: false },
});
