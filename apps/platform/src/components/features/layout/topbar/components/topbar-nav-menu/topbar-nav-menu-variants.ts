import {
  NAV_CURRENT_BAR,
  NAV_ROW_SHAPE,
} from '@platform/components/features/layout/sidebar/sidebar-variants';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const topbarNavMenuVariants = tv({
  slots: {
    trigger: [
      'md:hidden',
      'inline-flex size-11 shrink-0 items-center justify-center rounded-admin-control',
      'border border-admin-control-line bg-admin-surface text-admin-muted',
      'transition-colors duration-base ease-smooth',
      'hover:border-admin-brand-ink',
      'focus-visible:border-admin-brand-ink',
      focusRingClasses(FOCUS_RING_GROUND.BG),
      'data-[popup-open]:border-admin-brand-ink data-[popup-open]:text-admin-text',
    ],
    popup: [
      'flex w-72 max-w-[var(--available-width)] flex-col overflow-hidden p-1.5',
      'max-h-[var(--available-height)]',
    ],
    topZone: [
      'flex-none border-b border-admin-popover-line px-1.5 pt-1.5 pb-2.5',
    ],
    middleZone: ['min-h-0 flex-1 overflow-y-auto px-0.5 pb-2'],
    footZone: [
      'flex-none border-t border-admin-popover-line px-0.5 pt-2 pb-0.5',
    ],
    section: ['flex flex-col gap-1.5 px-1 pt-2.5'],
    sectionLabel: ['text-admin-muted'],
    row: [NAV_ROW_SHAPE, 'min-h-11 font-normal text-admin-text outline-none'],
    note: ['text-admin-muted'],
  },
  variants: {
    state: {
      current: {
        row: [
          'cursor-pointer bg-admin-popover-hover font-semibold',
          NAV_CURRENT_BAR,
          'before:inset-y-2.5 before:bg-admin-brand-ink',
        ],
      },
      resting: {
        row: [
          'cursor-pointer',
          'hover:bg-admin-popover-hover data-[highlighted]:bg-admin-popover-hover',
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
