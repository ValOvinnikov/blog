import { tv } from 'tailwind-variants';

export const formFieldVariants = tv({
  slots: {
    root: ['flex flex-col gap-[5px]'],
    label: [
      'flex items-center gap-[7px]',
      'text-[13px] font-semibold text-admin-text',
    ],
    error: ['text-[11.5px] text-admin-bad'],
  },
});
