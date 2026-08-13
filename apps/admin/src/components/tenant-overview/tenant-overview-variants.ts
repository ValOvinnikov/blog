import { tv } from 'tailwind-variants';

export const tenantOverviewVariants = tv({
  slots: {
    root: ['flex flex-col gap-2'],
    title: ['font-display text-2xl font-semibold text-text'],
    description: ['max-w-md text-sm text-text-muted'],
  },
});
