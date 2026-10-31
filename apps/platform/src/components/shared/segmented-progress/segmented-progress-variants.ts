import { STEP_INDICATOR_STATE } from '@platform/constants/step-indicator';
import { tv } from '@platform/utils/tv/tv';

export const segmentedProgressVariants = tv({
  slots: {
    root: ['flex flex-col gap-2.5'],
    label: ['text-admin-13 font-semibold'],
    track: ['flex gap-1.5'],
    segment: ['h-1 flex-1 rounded-admin-bar'],
  },
  variants: {
    isOnDark: {
      true: { label: ['text-admin-rail-text'] },
      false: { label: ['text-admin-muted'] },
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
      class: { segment: ['bg-admin-brand'] },
    },
    {
      isOnDark: false,
      state: STEP_INDICATOR_STATE.UPCOMING,
      class: { segment: ['bg-admin-line-2'] },
    },
    {
      isOnDark: true,
      state: STEP_INDICATOR_STATE.DONE,
      class: { segment: ['bg-admin-rail-accent'] },
    },
    {
      isOnDark: true,
      state: STEP_INDICATOR_STATE.ACTIVE,
      class: { segment: ['bg-white'] },
    },
    {
      isOnDark: true,
      state: STEP_INDICATOR_STATE.UPCOMING,
      class: { segment: ['bg-admin-rail-raised'] },
    },
  ],
  defaultVariants: { isOnDark: false },
});
