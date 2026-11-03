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
    // 72px above the popup (the top bar plus its 5px gap) and 12px below it.
    popup: [
      'flex w-72 max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-1.5',
      'max-h-[calc(100dvh-84px)]',
    ],
    topZone: [
      'flex-none border-b border-admin-popover-line px-1.5 pt-1.5 pb-2.5',
    ],
    middleZone: ['min-h-0 flex-1 overflow-y-auto px-0.5 pb-2'],
    footZone: [
      'flex-none border-t border-admin-popover-line px-0.5 pt-2 pb-0.5',
    ],
    section: ['flex flex-col gap-1.5 px-1 pt-2.5'],
    sectionLabel: [
      'truncate px-2.5 pb-1.5 text-admin-11 font-bold tracking-[0.09em] text-admin-muted uppercase',
    ],
    row: [
      'group relative flex min-h-11 items-center gap-2.5 rounded-admin-control px-2.5 py-2',
      'text-admin-13 font-normal text-admin-text outline-none',
    ],
    note: ['px-2.5 text-admin-12 leading-4 text-admin-muted'],
  },
  variants: {
    state: {
      current: {
        row: [
          'cursor-pointer bg-admin-popover-hover font-semibold',
          'before:absolute before:inset-y-2.5 before:left-0 before:w-[3px] before:rounded-r-admin-bar before:bg-admin-brand-ink',
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
