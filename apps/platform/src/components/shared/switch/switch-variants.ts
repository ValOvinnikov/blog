import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { HAS_DISABLED_DESCENDANT_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const switchVariants = tv({
  slots: {
    root: [
      'inline-flex min-h-11 items-center gap-2 md:min-h-0',
      'text-platform-13 text-platform-text',
      ...HAS_DISABLED_DESCENDANT_AFFORDANCE_CLASSES,
    ],
    track: [
      'relative h-5 w-9 shrink-0 rounded-full bg-platform-control-line',
      'transition-colors duration-150',
      'data-[disabled]:cursor-not-allowed',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    thumb: [
      'absolute left-0.5 top-0.5 size-4 rounded-full bg-platform-switch-thumb shadow-[0_1px_2px_rgba(16,24,40,.25)]',
      'transition-transform duration-150',
      'data-[checked]:translate-x-4 data-[checked]:bg-platform-switch-thumb-on',
    ],
    stateText: ['grid'],
    stateOption: ['col-start-1 row-start-1'],
  },
  variants: {
    isLocked: {
      true: {
        root: ['cursor-not-allowed'],
        track: ['cursor-not-allowed data-[checked]:bg-platform-control-line'],
      },
      false: {
        root: ['cursor-pointer'],
        track: ['cursor-pointer data-[checked]:bg-platform-brand'],
      },
    },
    isShown: {
      true: {},
      false: { stateOption: ['invisible'] },
    },
  },
  defaultVariants: {
    isLocked: false,
  },
});
