import { tv } from 'tailwind-variants';

export const formFieldVariants = tv({
  slots: {
    root: ['flex flex-col gap-1.5'],
    label: ['text-sm font-medium text-text'],
    error: ['text-xs text-error'],
  },
});
