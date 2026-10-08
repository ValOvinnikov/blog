import { CONTENT_ALIGNMENT, HERO_VARIANT } from '@blog/config';
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
    contentAlignment: {
      [CONTENT_ALIGNMENT.LEFT]: [],
      [CONTENT_ALIGNMENT.CENTER]: [],
      [CONTENT_ALIGNMENT.RIGHT]: [],
    },
  },
  compoundVariants: [
    {
      variant: HERO_VARIANT.SPLIT,
      ratio: 'video',
      class: ['lg:aspect-[4/3]'],
    },
    {
      variant: HERO_VARIANT.SPLIT,
      ratio: 'square',
      class: ['max-lg:max-w-72'],
    },
    {
      variant: HERO_VARIANT.SPLIT,
      ratio: 'square',
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
      class: ['max-lg:mx-auto'],
    },
    {
      variant: HERO_VARIANT.SPLIT,
      ratio: 'square',
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
      class: ['max-lg:ml-auto'],
    },
  ],
});

export type THeroMediaVariants = VariantProps<typeof heroMediaVariants>;
