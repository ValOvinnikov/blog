import { tv } from 'tailwind-variants';

export const plainSectionVariants = tv({
  slots: {
    root: ['rounded-md border border-border bg-surface p-4'],
    heading: ['mb-3'],
    body: ['flex flex-col gap-3'],
  },
});
