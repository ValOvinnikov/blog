import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const quoteCardVariants = tv({
  slots: {
    root: ['flex h-full flex-col gap-4'],
    quoteMark: ['text-brand-primary'],
    caption: ['mt-auto flex items-center gap-3'],
    person: ['flex flex-col justify-center'],
    role: ['text-sm text-subtle'],
  },
  variants: {
    align: {
      left: {},
      center: {
        root: [
          'items-center text-center',
          '[&_ul]:inline-block [&_ol]:inline-block [&_ul]:text-left [&_ol]:text-left',
        ],
        caption: ['flex-col'],
        person: ['items-center'],
      },
    },
    isSpotlight: {
      true: {
        root: ['mx-auto max-w-[38ch]'],
        quoteMark: ['size-6'],
      },
      false: {
        root: ['item-card surface-card px-card-x py-card-y'],
      },
    },
  },
  defaultVariants: {
    align: 'left',
    isSpotlight: false,
  },
});

export type TQuoteCardVariants = VariantProps<typeof quoteCardVariants>;
