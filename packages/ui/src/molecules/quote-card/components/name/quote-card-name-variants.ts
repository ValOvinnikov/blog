import { BRAND_VARIANT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const quoteCardNameVariants = tv({
  base: [
    'inline-block rounded-sm',
    'font-medium text-text no-underline',
    'transition-colors duration-base ease-smooth',
    'hover:text-brand-primary',
    'has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-primary',
    'has-[:focus-visible]:ring-offset-2',
  ],
  variants: {
    isSpotlight: {
      true: [],
      false: ['has-[:focus-visible]:ring-offset-surface'],
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
      class: 'has-[:focus-visible]:ring-offset-primary',
    },
    {
      isSpotlight: true,
      tone: BRAND_VARIANT.SECONDARY,
      class: 'has-[:focus-visible]:ring-offset-secondary',
    },
  ],
  defaultVariants: {
    isSpotlight: false,
  },
});

export type TQuoteCardNameVariants = VariantProps<typeof quoteCardNameVariants>;
