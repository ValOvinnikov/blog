import { tv } from '@platform/utils/tv/tv';

export const formFieldVariants = tv({
  slots: {
    root: ['flex flex-col gap-[5px]'],
    header: ['flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5'],
    label: [
      'flex items-center gap-[7px]',
      'text-[13px] font-semibold text-admin-text',
    ],
    hint: ['text-[11.5px] text-admin-muted'],
    error: ['text-[11.5px] text-admin-bad'],
  },
});
