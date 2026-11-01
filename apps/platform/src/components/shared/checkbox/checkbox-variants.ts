import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { HAS_DISABLED_DESCENDANT_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const checkboxVariants = tv({
  slots: {
    root: ['flex flex-col gap-[5px]'],
    label: [
      'flex min-h-11 cursor-pointer items-start gap-2 md:min-h-0',
      'text-admin-13 text-admin-text',
      ...HAS_DISABLED_DESCENDANT_AFFORDANCE_CLASSES,
    ],
    box: [
      'mt-px flex size-4 shrink-0 cursor-pointer items-center justify-center',
      'rounded-[4px] border border-admin-control-line bg-admin-surface',
      'transition-colors duration-150',
      'data-[checked]:border-admin-brand data-[checked]:bg-admin-brand',
      'data-[disabled]:cursor-not-allowed',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    tick: [
      'mb-0.5 h-2 w-1 rotate-45 border-b-2 border-r-2 border-admin-surface',
    ],
    error: ['text-admin-11-5 text-admin-bad'],
  },
});
