import { HAS_DISABLED_DESCENDANT_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { tv } from '@platform/utils/tv/tv';

export const switchVariants = tv({
  slots: {
    root: [
      'inline-flex min-h-11 cursor-pointer items-center gap-2 md:min-h-0',
      'text-[13px] text-admin-text',
      ...HAS_DISABLED_DESCENDANT_AFFORDANCE_CLASSES,
    ],
    track: [
      'relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-admin-line',
      'transition-colors duration-150',
      'data-[checked]:bg-admin-brand',
      'data-[disabled]:cursor-not-allowed',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
    ],
    thumb: [
      'absolute left-0.5 top-0.5 size-4 rounded-full bg-admin-surface shadow-admin',
      'transition-transform duration-150',
      'data-[checked]:translate-x-4',
    ],
    stateText: ['grid'],
    stateOption: ['col-start-1 row-start-1'],
  },
  variants: {
    isShown: {
      true: {},
      false: { stateOption: ['invisible'] },
    },
  },
});
