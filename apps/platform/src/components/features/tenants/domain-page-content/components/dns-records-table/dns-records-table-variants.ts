import { tv } from '@platform/utils/tv/tv';

export const dnsRecordsTableVariants = tv({
  slots: {
    table: ['mt-3.5 w-full border-collapse text-left font-mono text-admin-12'],
    head: [
      'border-b border-admin-line-2 px-[10px] py-2',
      'text-admin-11 font-bold text-admin-muted uppercase tracking-[.06em]',
    ],
    row: ['border-b border-admin-line-2 last:border-b-0'],
    cell: ['break-all px-[10px] py-2.5 align-middle text-admin-text'],
    copyable: ['flex items-center justify-between gap-2'],
    selectable: ['min-w-0 select-all'],
  },
});
