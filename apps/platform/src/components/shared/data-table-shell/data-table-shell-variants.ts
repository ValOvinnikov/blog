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
      'text-left text-[11px] font-bold text-admin-muted uppercase tracking-[.06em]',
    ],
    row: [
      'border-b border-admin-line-2 last:border-b-0 hover:bg-admin-surface-2',
    ],
    cell: ['px-[14px] py-3 align-middle text-[13.5px] text-admin-text'],
    empty: ['p-8 text-center text-[13.5px] text-admin-muted'],
  },
});
