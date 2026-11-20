import { USAGE_LEVEL } from '@platform/constants/usage';
import { tv } from '@platform/utils/tv/tv';

export const usageMeterVariants = tv({
  slots: {
    root: ['w-full'],
    track: ['block h-2 w-full overflow-hidden rounded-full bg-platform-line'],
    indicator: ['block h-full rounded-full bg-platform-brand'],
  },
  variants: {
    level: {
      [USAGE_LEVEL.UNDER]: {},
      [USAGE_LEVEL.NEAR]: { indicator: ['bg-platform-warn'] },
      [USAGE_LEVEL.FULL]: { indicator: ['rounded-none bg-platform-warn'] },
    },
    isMonthly: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      level: USAGE_LEVEL.FULL,
      isMonthly: true,
      class: { indicator: ['bg-platform-bad'] },
    },
  ],
});
