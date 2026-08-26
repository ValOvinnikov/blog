import { tv } from 'tailwind-variants';

export const formFieldVariants = tv({
  slots: {
    root: ['flex flex-col gap-1.5'],
    label: ['text-[13px] font-semibold text-admin-text'],
    error: ['text-xs text-admin-bad'],
  },
});
