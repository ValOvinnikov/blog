import { tv } from '@platform/utils/tv/tv';

export const dataTableShellVariants = tv({
  slots: {
    card: ['overflow-hidden'],
    scrollRegion: [
      'overflow-x-auto',
      // Inset because the card's overflow-hidden would clip an offset ring.
      'outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-brand',
    ],
    table: ['w-full border-collapse text-left'],
    head: [
      'border-b border-admin-line-2 px-[14px] py-2.5',
      'text-left text-admin-11 font-bold text-admin-muted uppercase tracking-[.06em]',
    ],
    sortButton: [
      'inline-flex cursor-pointer items-center gap-1 rounded-admin-control uppercase',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
      'hover:text-admin-text',
    ],
    sortIcon: [],
    toolbar: [
      'flex flex-wrap items-end gap-4',
      'border-b border-admin-line-2 px-[14px] py-3',
    ],
    row: [
      'border-b border-admin-line-2 last:border-b-0 hover:bg-admin-surface-2',
    ],
    cell: ['px-[14px] py-3 align-middle text-admin-13-5 text-admin-text'],
    empty: ['p-[50px] text-center text-admin-13-5 text-admin-muted'],
  },
  variants: {
    isAscending: {
      true: { sortIcon: ['rotate-180'] },
    },
  },
});
