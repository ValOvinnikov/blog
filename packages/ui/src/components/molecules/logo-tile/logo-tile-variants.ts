import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const logoTileVariants = tv({
  base: [
    'relative grid w-[192px] h-[88px] place-items-center',
    'rounded-lg border border-border dark:border-border-strong bg-surface',
    'px-card-x py-card-y',
  ],
  variants: {
    isInteractive: {
      true: [
        'opacity-80 transition-opacity duration-base ease-smooth',
        'hover:opacity-100 focus-within:opacity-100',
        'motion-reduce:transition-none',
        'hover:border-border-strong dark:hover:border-border-emphasis',
        'has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand-primary',
        'has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-ambient',
        '[&_a]:flex [&_a]:size-full [&_a]:items-center [&_a]:justify-center',
        '[&_a]:outline-none',
        "[&_a]:after:absolute [&_a]:after:inset-0 [&_a]:after:rounded-lg [&_a]:after:content-['']",
      ],
      false: [],
    },
  },
  defaultVariants: {
    isInteractive: false,
  },
});

export type TLogoTileVariants = VariantProps<typeof logoTileVariants>;
