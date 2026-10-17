import { tv } from 'tailwind-variants';

export const contactFormFieldVariants = tv({
  slots: {
    root: ['flex min-w-0 flex-col gap-1.5'],
    label: ['font-mono text-label text-text'],
    error: ['m-0 text-meta text-error'],
  },
});
