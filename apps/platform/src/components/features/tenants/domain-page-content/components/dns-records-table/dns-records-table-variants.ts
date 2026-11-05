import { tv } from '@platform/utils/tv/tv';

export const dnsRecordsTableVariants = tv({
  slots: {
    table: [
      'mt-3.5 w-full border-collapse text-left font-admin-mono text-admin-12',
    ],
    head: [
      'border-b border-admin-line-2 px-2.5 py-2',
      'text-admin-11 font-bold text-admin-muted uppercase tracking-admin-caps',
    ],
    row: ['border-b border-admin-line-2 last:border-b-0'],
    cell: ['break-all p-2.5 align-middle text-admin-text'],
    copyable: ['flex items-center justify-between gap-2'],
    selectable: ['min-w-0 select-all'],
  },
  variants: {
    isRecordData: {
      true: { cell: ['font-medium'] },
      false: {},
    },
  },
});
