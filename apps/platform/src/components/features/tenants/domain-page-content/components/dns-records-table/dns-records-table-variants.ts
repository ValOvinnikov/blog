import { tv } from '@platform/utils/tv/tv';

export const dnsRecordsTableVariants = tv({
  slots: {
    table: ['mt-3.5 w-full border-collapse text-left font-mono text-[12px]'],
    head: [
      'border-b border-admin-line-2 px-[10px] py-2',
      'font-ui text-label font-bold text-admin-faint uppercase tracking-[.06em]',
    ],
    row: ['border-b border-admin-line-2 last:border-b-0'],
    cell: ['break-all px-[10px] py-2.5 align-middle text-admin-text'],
  },
});
