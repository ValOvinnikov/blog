import {
  FOCUS_RING_GROUND,
  FOCUS_RING_TRIGGER,
} from '@platform/constants/focus-ring';
import { PRESET_LIST_LAYOUT } from '@platform/constants/preset-list';
import {
  focusRingClasses,
  insetFocusRingClasses,
} from '@platform/utils/focus-ring-classes/focus-ring-classes';
import {
  SELECTED_CHOICE_CLASSES,
  SELECTED_ROW_CLASSES,
  UNSELECTED_CHOICE_CLASSES,
} from '@platform/utils/selected-choice-classes/selected-choice-classes';
import { tv } from '@platform/utils/tv/tv';

export const presetListOptionVariants = tv({
  slots: {
    option: ['flex min-h-16 cursor-pointer items-center text-left'],
    text: ['flex min-w-0 flex-1 flex-col gap-0.5'],
    name: ['text-platform-13-5 font-semibold text-platform-text'],
    description: ['text-platform-12-5 leading-[17px] text-platform-muted'],
    tick: ['shrink-0 text-platform-text'],
  },
  variants: {
    layout: {
      [PRESET_LIST_LAYOUT.GRID]: {
        option: [
          'gap-2.5 rounded-platform-control bg-platform-surface px-2.5 py-2',
          focusRingClasses(
            FOCUS_RING_GROUND.POPOVER,
            FOCUS_RING_TRIGGER.LIST_HIGHLIGHTED,
          ),
        ],
      },
      [PRESET_LIST_LAYOUT.ROWS]: {
        option: ['gap-3 border-b border-platform-line-2 px-4 py-2'],
      },
    },
    selected: { true: {}, false: {} },
  },
  compoundVariants: [
    {
      layout: PRESET_LIST_LAYOUT.GRID,
      selected: true,
      class: {
        option: SELECTED_CHOICE_CLASSES,
        tick: [
          'rounded-full bg-platform-selected p-0.5 text-platform-on-selected',
        ],
      },
    },
    {
      layout: PRESET_LIST_LAYOUT.GRID,
      selected: false,
      class: {
        option: [
          ...UNSELECTED_CHOICE_CLASSES,
          'border-platform-control-line hover:border-platform-muted hover:bg-platform-hover-tint',
        ],
      },
    },
    {
      layout: PRESET_LIST_LAYOUT.ROWS,
      selected: true,
      class: {
        option: [
          ...SELECTED_ROW_CLASSES,
          insetFocusRingClasses(
            FOCUS_RING_GROUND.SELECTED_TINT,
            FOCUS_RING_TRIGGER.LIST_HIGHLIGHTED,
          ),
        ],
      },
    },
    {
      layout: PRESET_LIST_LAYOUT.ROWS,
      selected: false,
      class: {
        option: [
          insetFocusRingClasses(
            FOCUS_RING_GROUND.SURFACE,
            FOCUS_RING_TRIGGER.LIST_HIGHLIGHTED,
          ),
        ],
      },
    },
  ],
});
