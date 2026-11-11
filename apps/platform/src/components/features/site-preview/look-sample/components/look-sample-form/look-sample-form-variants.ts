import { tv } from '@platform/utils/tv/tv';

export const lookSampleFormVariants = tv({
  slots: {
    root: ['flex max-w-[40rem] flex-col gap-1.5'],
    label: ['font-mono text-label text-text'],
    row: ['flex flex-col gap-2.5 @[40rem]:flex-row @[40rem]:items-center'],
    field: ['grow'],
  },
});
