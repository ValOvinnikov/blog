import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const logoTileVariants = tv({
  base: [
    'grid place-items-center',
    'min-w-[156px] sm:min-w-[176px] md:min-w-[154px] lg:min-w-[169px]',
    'max-w-[180px]',
    'px-card-x py-card-y',
    '[&_img]:block [&_img]:max-h-9 [&_img]:w-auto [&_img]:max-w-full',
  ],
  variants: {
    isInteractive: {
      true: [
        'opacity-80 transition-opacity duration-base ease-smooth',
        'hover:opacity-100 focus-within:opacity-100',
        'motion-reduce:transition-none',
      ],
      false: [],
    },
  },
  defaultVariants: {
    isInteractive: false,
  },
});

export type TLogoTileVariants = VariantProps<typeof logoTileVariants>;
