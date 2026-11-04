import { PRESET_LIST_LAYOUT } from '@platform/constants/preset-list';
import {
  SELECTED_CHOICE_CLASSES,
  UNSELECTED_CHOICE_CLASSES,
} from '@platform/utils/selected-choice-classes/selected-choice-classes';
import { tv } from '@platform/utils/tv/tv';

export const presetListOptionVariants = tv({
  slots: {
    option: [
      'flex min-h-16 cursor-pointer items-center text-left',
      'data-[highlighted]:outline-admin-brand-ink group-focus-visible:data-[highlighted]:outline-2',
    ],
    text: ['flex min-w-0 flex-1 flex-col gap-0.5'],
    name: ['text-admin-13-5 font-semibold text-admin-text'],
    description: ['text-admin-12-5 leading-[17px] text-admin-muted'],
    tick: ['shrink-0 text-admin-brand-ink'],
  },
  variants: {
    layout: {
      [PRESET_LIST_LAYOUT.GRID]: {
        option: [
          'gap-2.5 rounded-admin-control bg-admin-surface px-2.5 py-2',
          'data-[highlighted]:outline-offset-2',
        ],
      },
      [PRESET_LIST_LAYOUT.ROWS]: {
        option: [
          'gap-3 border-b border-admin-line-2 px-4 py-2',
          'data-[highlighted]:-outline-offset-2',
        ],
      },
    },
    selected: { true: {}, false: {} },
  },
  compoundVariants: [
    {
      layout: PRESET_LIST_LAYOUT.GRID,
      selected: true,
      class: { option: SELECTED_CHOICE_CLASSES },
    },
    {
      layout: PRESET_LIST_LAYOUT.GRID,
      selected: false,
      class: {
        option: [
          ...UNSELECTED_CHOICE_CLASSES,
          'border-admin-control-line hover:border-admin-muted hover:bg-admin-surface-2',
        ],
      },
    },
    {
      layout: PRESET_LIST_LAYOUT.ROWS,
      selected: true,
      class: {
        option: [
          'bg-admin-brand-weak shadow-[inset_3px_0_0_var(--admin-brand-ink)]',
        ],
      },
    },
  ],
});
