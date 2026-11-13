import { tv } from '@platform/utils/tv/tv';

export const dnsRecordsTableVariants = tv({
  slots: {
    table: [
      'mt-3.5 w-full border-collapse text-left font-platform-mono text-platform-12',
    ],
    head: [
      'border-b border-platform-line-2 px-2.5 py-2',
      'text-platform-11 font-bold text-platform-muted uppercase tracking-platform-caps',
    ],
    row: ['border-b border-platform-line-2 last:border-b-0'],
    cell: ['break-all p-2.5 align-middle text-platform-text'],
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
