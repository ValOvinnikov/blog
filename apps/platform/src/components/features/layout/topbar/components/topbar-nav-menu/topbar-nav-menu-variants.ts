import {
  NAV_CURRENT_BAR,
  NAV_ROW_SHAPE,
} from '@platform/components/features/layout/sidebar/sidebar-variants';
import { BAR_CONTROL_CLASSES } from '@platform/utils/bar-control-classes/bar-control-classes';
import { tv } from '@platform/utils/tv/tv';

export const topbarNavMenuVariants = tv({
  slots: {
    trigger: [
      ...BAR_CONTROL_CLASSES,
      'md:hidden',
      'inline-flex size-11 shrink-0 items-center justify-center text-platform-muted',
      'data-[popup-open]:text-platform-text',
    ],
    popup: [
      'flex w-72 max-w-[var(--available-width)] flex-col overflow-hidden p-1.5',
      'max-h-[var(--available-height)]',
    ],
    topZone: [
      'flex-none border-b border-platform-popover-line px-1.5 pt-1.5 pb-2.5',
    ],
    middleZone: ['min-h-0 flex-1 overflow-y-auto px-0.5 pb-2'],
    footZone: [
      'flex-none border-t border-platform-popover-line px-0.5 pt-2 pb-0.5',
    ],
    section: ['flex flex-col gap-1.5 px-1 pt-2.5'],
    sectionLabel: ['text-platform-muted'],
    row: [
      NAV_ROW_SHAPE,
      'min-h-11 font-normal text-platform-text outline-none',
    ],
    note: ['text-platform-muted'],
  },
  variants: {
    state: {
      current: {
        row: [
          'cursor-pointer bg-platform-popover-hover font-semibold',
          NAV_CURRENT_BAR,
          'before:inset-y-2.5 before:bg-platform-brand-ink',
        ],
      },
      resting: {
        row: [
          'cursor-pointer',
          'hover:bg-platform-popover-hover data-[highlighted]:bg-platform-popover-hover',
        ],
      },
      inert: {
        row: [],
      },
    },
  },
  defaultVariants: {
    state: 'resting',
  },
});
