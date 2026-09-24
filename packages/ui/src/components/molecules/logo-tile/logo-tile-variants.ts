import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const logoTileVariants = tv({
  base: [
    'grid w-[192px] h-[88px] place-items-center',
    'rounded-lg border border-border bg-surface',
    'px-card-x py-card-y',
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
  },
  defaultVariants: {
    isInteractive: false,
    hasAspectRatio: false,
  },
});

export type TLogoTileVariants = VariantProps<typeof logoTileVariants>;
