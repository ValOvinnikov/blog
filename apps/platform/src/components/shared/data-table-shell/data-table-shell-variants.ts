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
    table: ['group/table w-full border-collapse text-left'],
    thead: [],
    tbody: [],
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
      'max-md:group-data-stacked/table:flex max-md:group-data-stacked/table:flex-col max-md:group-data-stacked/table:gap-2 max-md:group-data-stacked/table:p-[14px]',
    ],
    cell: [
      'px-[14px] py-3 align-middle text-platform-13-5 text-platform-text break-words',
      'max-md:group-data-stacked/table:block max-md:group-data-stacked/table:p-0 max-md:group-data-stacked/table:empty:hidden',
    ],
    stackedCellLabel: ['sr-only md:hidden'],
    empty: ['p-[50px] text-center text-platform-13-5 text-platform-muted'],
    note: [
      'border-t border-platform-line-2 px-[14px] py-4',
      'text-center text-platform-13-5 text-platform-muted',
    ],
  },
  variants: {
    isAscending: {
      true: { sortIcon: ['rotate-180'] },
    },
    isSortable: {
      true: { head: ['p-0'] },
    },
    isStacked: {
      true: {
        table: ['max-md:block'],
        thead: ['max-md:hidden'],
        tbody: ['max-md:block'],
      },
    },
    hasWidths: {
      true: { table: ['md:table-fixed'] },
    },
  },
});
