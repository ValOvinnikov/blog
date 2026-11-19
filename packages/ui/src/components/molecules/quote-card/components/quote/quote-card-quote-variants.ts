import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const quoteCardQuoteVariants = tv({
  base: [TYPOGRAPHY[TEXT_ROLE.QUOTE], 'm-0'],
  variants: {
    isSpotlight: {
      true: ['text-prose-h4'],
      false: [],
    },
  },
  defaultVariants: {
    isSpotlight: false,
  },
});

export type TQuoteCardQuoteVariants = VariantProps<
  typeof quoteCardQuoteVariants
>;
