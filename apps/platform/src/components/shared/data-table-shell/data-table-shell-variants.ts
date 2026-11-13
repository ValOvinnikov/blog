import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const dataTableShellVariants = tv({
  slots: {
    card: ['overflow-hidden'],
    scrollRegion: [
      'overflow-x-auto',
      insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    table: ['w-full border-collapse text-left'],
    head: [
      'border-b border-platform-line-2 px-[14px] py-2.5',
      'text-left text-platform-11 font-bold text-platform-muted uppercase tracking-platform-caps',
    ],
    sortButton: [
      'flex w-full cursor-pointer items-center gap-1 px-[14px] py-2.5 uppercase',
      insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE),
      'hover:text-platform-text',
    ],
    sortIcon: [],
    toolbar: [
      'flex flex-wrap items-end gap-4',
      'border-b border-platform-line-2 px-[14px] py-3',
    ],
    row: [
      'border-b border-platform-line-2 last:border-b-0 hover:bg-platform-surface-2',
    ],
    cell: ['px-[14px] py-3 align-middle text-platform-13-5 text-platform-text'],
    empty: ['p-[50px] text-center text-platform-13-5 text-platform-muted'],
  },
  variants: {
    isAscending: {
      true: { sortIcon: ['rotate-180'] },
    },
    isSortable: {
      true: { head: ['p-0'] },
    },
  },
});
