import { INTERACTIVE_ITEM_CARD, tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const logoTileVariants = tv({
  slots: {
    root: [
      'relative grid w-[192px] h-[88px] place-items-center overflow-hidden',
      'rounded-media border border-border dark:border-border-strong bg-surface',
      'px-card-x py-card-y',
    ],
    lightLogo: ['contents dark:hidden'],
    link: ['absolute inset-0 outline-none'],
  },
  variants: {
    isInteractive: {
      true: {
        root: [
          INTERACTIVE_ITEM_CARD,
          'hover:border-border-strong dark:hover:border-border-emphasis',
          'has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-brand-primary',
          'has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-ambient',
        ],
      },
      false: {},
    },
  },
  defaultVariants: {
    isInteractive: false,
  },
});

export type TLogoTileVariants = VariantProps<typeof logoTileVariants>;
