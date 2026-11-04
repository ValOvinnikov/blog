import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { DISABLED_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const morePresetsButtonVariants = tv({
  base: [
    'inline-flex h-10 flex-none cursor-pointer items-center gap-1.5 rounded-admin-control border border-admin-control-line bg-admin-surface pr-2.5 pl-3',
    'text-admin-13 font-semibold whitespace-nowrap text-admin-brand-strong',
    'not-data-[disabled]:hover:bg-admin-bg',
    'data-[popup-open]:border-admin-brand-ink data-[popup-open]:bg-admin-brand-weak data-[popup-open]:hover:bg-admin-brand-weak',
    focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ...DISABLED_AFFORDANCE_CLASSES,
  ],
});

export const morePresetsLabelVariants = tv({
  slots: {
    pill: [
      'inline-flex h-5 min-w-5 items-center justify-center rounded-admin-10 bg-admin-brand-weak px-1.5',
      'text-admin-11-5 font-semibold text-admin-brand-strong',
    ],
  },
});
