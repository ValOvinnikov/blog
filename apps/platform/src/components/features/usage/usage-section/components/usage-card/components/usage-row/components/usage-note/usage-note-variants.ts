import { USAGE_LEVEL } from '@platform/constants/usage';
import { tv } from '@platform/utils/tv/tv';

export const usageNoteVariants = tv({
  slots: {
    root: ['m-0 text-platform-13 leading-platform-18 text-platform-muted'],
    separator: ['mx-1.5 text-platform-faint'],
    reset: ['font-normal text-platform-muted'],
  },
  variants: {
    level: {
      [USAGE_LEVEL.UNDER]: {},
      [USAGE_LEVEL.NEAR]: { root: ['font-medium text-platform-warn'] },
      [USAGE_LEVEL.FULL]: { root: ['font-medium text-platform-warn'] },
    },
    isMonthly: {
      true: {},
      false: {},
    },
    isPaused: {
      true: { root: ['font-semibold text-platform-bad'] },
    },
  },
  compoundVariants: [
    {
      level: USAGE_LEVEL.FULL,
      isMonthly: true,
      class: { root: ['font-semibold text-platform-bad'] },
    },
  ],
});
