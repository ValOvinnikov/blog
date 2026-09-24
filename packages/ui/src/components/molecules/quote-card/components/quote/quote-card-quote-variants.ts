import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const quoteCardQuoteVariants = tv({
  base: ['font-read italic text-text', 'm-0'],
  variants: {
    isSpotlight: {
      true: ['text-prose-h4'],
      false: ['text-prose'],
    },
  },
  defaultVariants: {
    isSpotlight: false,
  },
});

export type TQuoteCardQuoteVariants = VariantProps<
  typeof quoteCardQuoteVariants
>;
