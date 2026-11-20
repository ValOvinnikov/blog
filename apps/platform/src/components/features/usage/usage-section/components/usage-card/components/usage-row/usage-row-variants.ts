import { USAGE_LEVEL } from '@platform/constants/usage';
import { tv } from '@platform/utils/tv/tv';

export const usageRowVariants = tv({
  slots: {
    root: [
      'flex min-w-0 flex-col gap-2 px-4 pt-3.5 pb-4',
      'border-t border-platform-line-2 first:border-t-0',
      'md:px-platform-card md:pt-4 md:pb-platform-card',
      'md:even:border-l md:nth-[-n+2]:border-t-0 md:last:odd:col-span-2',
    ],
    top: ['flex min-w-0 items-center gap-2'],
    label: ['text-platform-12-5 leading-platform-18 text-platform-muted'],
    link: ['ml-auto text-platform-12-5 leading-platform-18'],
    value: [
      'm-0 flex items-baseline gap-1.5',
      'text-platform-14 leading-5 text-platform-muted',
    ],
    count: [
      'text-platform-24 leading-none font-bold tabular-nums text-platform-text',
    ],
  },
  variants: {
    level: {
      [USAGE_LEVEL.UNDER]: {},
      [USAGE_LEVEL.NEAR]: { count: ['text-platform-warn'] },
      [USAGE_LEVEL.FULL]: { count: ['text-platform-warn'] },
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
      class: { count: ['text-platform-bad'] },
    },
  ],
});
