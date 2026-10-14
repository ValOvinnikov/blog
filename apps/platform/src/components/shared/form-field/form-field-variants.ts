import { tv } from '@platform/utils/tv/tv';

export const formFieldVariants = tv({
  slots: {
    root: ['flex flex-col gap-[5px]'],
    header: ['flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5'],
    label: [
      'flex items-center gap-[7px]',
      'text-admin-13 font-semibold text-admin-text',
    ],
    error: ['text-admin-11-5 text-admin-bad'],
  },
});
