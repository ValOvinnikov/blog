import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const pricingCardVariants = tv({
  base: [
    'relative flex h-full flex-col gap-4',
    'rounded-md border border-border bg-surface',
    'px-card-x py-card-y',
  ],
  variants: {
    isHighlighted: {
      true: ['border-brand-primary pt-8 shadow-md'],
      false: [],
    },
  },
  defaultVariants: { isHighlighted: false },
});

export type TPricingCardVariants = VariantProps<typeof pricingCardVariants>;
