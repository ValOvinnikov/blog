import { tv } from 'tailwind-variants';

export const tenantsViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    header: ['flex flex-wrap items-start justify-between gap-4'],
    description: ['mt-1 max-w-md text-sm text-text-muted'],
  },
});
