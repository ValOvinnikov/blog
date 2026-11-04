import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { DISABLED_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import {
  SELECTED_CHOICE_CLASSES,
  UNSELECTED_CHOICE_CLASSES,
} from '@platform/utils/selected-choice-classes/selected-choice-classes';
import { tv } from '@platform/utils/tv/tv';

export const presetChipsVariants = tv({
  slots: {
    root: ['flex flex-none flex-nowrap gap-3'],
    chip: [
      'flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-admin-control bg-admin-surface pr-3 pl-1.5 lg:h-10',
      'text-admin-13-5 font-semibold whitespace-nowrap text-admin-text',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
      ...DISABLED_AFFORDANCE_CLASSES,
    ],
    tick: ['text-admin-brand-ink'],
    description: ['sr-only'],
  },
  variants: {
    selected: {
      true: {
        chip: SELECTED_CHOICE_CLASSES,
      },
      false: {
        chip: [
          ...UNSELECTED_CHOICE_CLASSES,
          'border-admin-control-line not-data-[disabled]:hover:border-admin-brand-ink',
        ],
      },
    },
  },
});
