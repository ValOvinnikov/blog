import { HERO_VARIANT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const heroMediaVariants = tv({
  base: ['w-full', 'min-h-[170px]'],
  variants: {
    ratio: {
      video: [],
      square: [],
      portrait: [],
      classic: [],
    },
    variant: {
      [HERO_VARIANT.SPLIT]: {},
      [HERO_VARIANT.STACKED]: {},
      [HERO_VARIANT.BANNER]: {},
    },
  },
  compoundVariants: [
    {
      variant: HERO_VARIANT.SPLIT,
      ratio: 'video',
      class: ['lg:aspect-[4/3]'],
    },
  ],
});

export type THeroMediaVariants = VariantProps<typeof heroMediaVariants>;
