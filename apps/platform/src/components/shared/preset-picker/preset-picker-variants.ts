import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { PRESET_PICKER_LAYOUT } from '@platform/constants/preset-picker';
import { DISABLED_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import {
  SELECTED_CHOICE_CLASSES,
  SELECTED_COMPACT_FILL_CLASSES,
  UNSELECTED_CHOICE_CLASSES,
} from '@platform/utils/selected-choice-classes/selected-choice-classes';
import { tv } from '@platform/utils/tv/tv';

export const presetPickerVariants = tv({
  slots: {
    root: ['grid'],
    card: [
      'relative flex min-w-0 cursor-pointer flex-col gap-2.5 rounded-platform bg-platform-surface p-2 text-left',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
      ...DISABLED_AFFORDANCE_CLASSES,
    ],
    footer: ['flex items-start gap-2 px-1 pb-1'],
    footerText: ['flex min-w-0 flex-1 flex-col gap-0.5'],
    name: ['text-platform-14 font-semibold text-platform-text'],
    description: [
      'text-platform-12-5 leading-platform-1-4 text-platform-muted',
    ],
    dot: [
      'flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px]',
    ],
  },
  variants: {
    layout: {
      [PRESET_PICKER_LAYOUT.RESPONSIVE]: {
        root: ['grid-cols-1 gap-3 @sm:grid-cols-2'],
      },
      [PRESET_PICKER_LAYOUT.PAIRED]: {
        root: ['grid-cols-2 gap-2.5 md:gap-3.5'],
      },
    },
    selected: {
      true: {
        card: SELECTED_CHOICE_CLASSES,
        dot: [SELECTED_COMPACT_FILL_CLASSES],
      },
      false: {
        card: [
          ...UNSELECTED_CHOICE_CLASSES,
          'border-platform-line not-data-[disabled]:hover:bg-platform-hover-tint',
        ],
        dot: ['border-platform-control-line'],
      },
    },
  },
});
