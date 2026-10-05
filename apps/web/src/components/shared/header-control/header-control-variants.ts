import { tv } from 'tailwind-variants';

export const headerControlVariants = tv({
  base: [
    'inline-flex shrink-0 items-center justify-center gap-1',
    'rounded-sm border border-border-strong bg-surface text-text',
    'hover:border-brand-primary hover:bg-surface hover:text-brand-primary',
  ],
  variants: {
    shape: {
      square: ['size-11 px-0 lg:size-9'],
      label: ['size-auto min-h-11 px-3 py-0 lg:min-h-9'],
    },
  },
  defaultVariants: { shape: 'label' },
});
