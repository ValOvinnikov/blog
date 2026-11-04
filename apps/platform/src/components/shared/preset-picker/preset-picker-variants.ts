import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { PRESET_PICKER_LAYOUT } from '@platform/constants/preset-picker';
import { DISABLED_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import {
  SELECTED_CHOICE_CLASSES,
  UNSELECTED_CHOICE_CLASSES,
} from '@platform/utils/selected-choice-classes/selected-choice-classes';
import { tv } from '@platform/utils/tv/tv';

export const presetPickerVariants = tv({
  slots: {
    root: ['grid'],
    card: [
      'relative flex min-w-0 cursor-pointer flex-col gap-2.5 rounded-admin bg-admin-surface p-2 text-left',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
      ...DISABLED_AFFORDANCE_CLASSES,
    ],
    footer: ['flex items-start gap-2 px-1 pb-1'],
    footerText: ['flex min-w-0 flex-1 flex-col gap-0.5'],
    name: ['text-admin-14 font-semibold text-admin-text'],
    description: ['text-admin-12-5 leading-admin-1-4 text-admin-muted'],
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
        dot: [
          'border-admin-brand-ink bg-admin-brand-ink text-admin-on-brand-ink',
        ],
      },
      false: {
        card: [...UNSELECTED_CHOICE_CLASSES, 'border-admin-line'],
        dot: ['border-admin-control-line'],
      },
    },
  },
});
