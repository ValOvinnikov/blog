import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const logoTileVariants = tv({
  base: [
    'grid w-[144px] h-[88px] place-items-center',
    'rounded-lg border border-border bg-surface',
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
