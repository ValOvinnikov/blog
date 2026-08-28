import { tv } from '@platform/utils/tv/tv';

export const tenantsTableVariants = tv({
  slots: {
    card: ['overflow-hidden'],
    table: ['w-full border-collapse text-left'],
    head: [
      'border-b border-admin-line-2 px-[14px] py-2.5',
      'text-left text-label font-bold text-admin-faint uppercase tracking-[.06em]',
    ],
    row: [
      'border-b border-admin-line-2 last:border-b-0 hover:bg-admin-surface-2',
    ],
    cell: ['px-[14px] py-3 align-middle text-[13.5px] text-admin-text'],
    tname: ['flex items-center gap-2.5'],
    name: ['text-admin-text'],
    domain: ['text-meta text-admin-faint'],
    empty: ['p-8 text-center text-sm text-admin-muted'],
  },
});
