import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { DISABLED_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const morePresetsButtonVariants = tv({
  base: [
    'inline-flex h-10 flex-none cursor-pointer items-center gap-1.5 rounded-platform-control border border-platform-control-line bg-platform-surface pr-2.5 pl-3',
    'text-platform-13 font-semibold whitespace-nowrap text-platform-brand-strong',
    'not-data-[disabled]:hover:bg-platform-bg',
    'data-[popup-open]:border-platform-brand-ink data-[popup-open]:bg-platform-brand-weak data-[popup-open]:hover:bg-platform-brand-weak',
    focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ...DISABLED_AFFORDANCE_CLASSES,
  ],
});

export const morePresetsLabelVariants = tv({
  slots: {
    pill: [
      'inline-flex h-5 min-w-5 items-center justify-center rounded-platform-10 bg-platform-brand-weak px-1.5',
      'text-platform-11-5 font-semibold text-platform-brand-strong',
    ],
  },
});
