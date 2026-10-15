import { BRAND_VARIANT } from '@blog/config';
import { LINK_UNDERLINE, tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const quoteCardNameVariants = tv({
  base: [
    'inline-block rounded-sm',
    ...LINK_UNDERLINE,
    'font-medium text-text decoration-border-strong not-has-[a]:no-underline',
    'has-[a]:transition-colors has-[a]:duration-base has-[a]:ease-smooth',
    'has-[a]:hover:text-brand-primary',
    'has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-primary',
    'has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ambient',
  ],
  variants: {
    isSpotlight: {
      true: [],
      false: [],
    },
    tone: {
      [BRAND_VARIANT.PRIMARY]: [],
      [BRAND_VARIANT.SECONDARY]: [],
      [BRAND_VARIANT.BRAND_PRIMARY]: [],
    },
  },
  defaultVariants: {
    isSpotlight: false,
  },
});

export type TQuoteCardNameVariants = VariantProps<typeof quoteCardNameVariants>;
