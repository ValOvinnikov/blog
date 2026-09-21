import { BRAND_VARIANT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const quoteCardNameVariants = tv({
  base: [
    'font-medium text-text no-underline',
    'transition-colors duration-base ease-smooth',
    'hover:text-brand-primary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    'focus-visible:ring-offset-2',
  ],
  variants: {
    isSpotlight: {
      true: [],
      false: ['focus-visible:ring-offset-surface'],
    },
    tone: {
      [BRAND_VARIANT.PRIMARY]: [],
      [BRAND_VARIANT.SECONDARY]: [],
    },
  },
  compoundVariants: [
    {
      isSpotlight: true,
      tone: BRAND_VARIANT.PRIMARY,
      class: 'focus-visible:ring-offset-primary',
    },
    {
      isSpotlight: true,
      tone: BRAND_VARIANT.SECONDARY,
      class: 'focus-visible:ring-offset-secondary',
    },
  ],
  defaultVariants: {
    isSpotlight: false,
  },
});

export type TQuoteCardNameVariants = VariantProps<typeof quoteCardNameVariants>;
