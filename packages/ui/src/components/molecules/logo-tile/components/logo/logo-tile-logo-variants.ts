import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const logoTileLogoVariants = tv({
  base: 'contents',
  variants: {
    hasAspectRatio: {
      true: [
        '[&_img]:aspect-[var(--logo-aspect)] [&_img]:h-auto',
        '[&_img]:w-[min(calc(2.25rem*var(--logo-aspect)),100%)]',
        '[&_img]:object-fill [&_img]:block',
      ],
      false: [
        '[&_img]:block [&_img]:max-h-9 [&_img]:w-auto [&_img]:max-w-full',
      ],
    },
    visibleIn: {
      all: [],
      light: ['dark:hidden'],
      dark: ['hidden dark:contents'],
    },
  },
  defaultVariants: {
    hasAspectRatio: false,
    visibleIn: 'all',
  },
});

export type TLogoTileLogoVariants = VariantProps<typeof logoTileLogoVariants>;
