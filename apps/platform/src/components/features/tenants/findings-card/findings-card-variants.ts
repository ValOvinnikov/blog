import { tv } from '@platform/utils/tv/tv';

export const findingsCardVariants = tv({
  slots: {
    list: ['flex flex-col'],
    row: [
      'flex items-start gap-3 py-2.5',
      'border-b border-admin-line-2 last:border-b-0',
    ],
    body: ['flex min-w-0 flex-1 flex-col gap-1'],
    kindText: ['block text-[13px] text-admin-text'],
    sourceText: ['block text-[12px] text-admin-faint'],
    time: ['flex-none pt-0.5 text-[12px] text-admin-muted'],
    empty: ['text-[13px] text-admin-muted'],
  },
});
