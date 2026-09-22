import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const quoteCardVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-4',
      'bg-surface border-l-2 border-brand-primary',
      'px-card-x py-card-y',
    ],
    quoteMark: ['text-brand-primary'],
    caption: ['flex items-center gap-3'],
    person: ['flex flex-col'],
    role: ['text-sm text-subtle'],
  },
  variants: {
    align: {
      left: {},
      center: {
        root: ['items-center text-center'],
        caption: ['flex-col'],
        person: ['items-center'],
      },
    },
    isSpotlight: {
      true: {
        root: ['mx-auto max-w-[52ch] border-l-0 bg-transparent px-0 py-0'],
        quoteMark: ['size-10'],
      },
      false: {},
    },
  },
  defaultVariants: {
    align: 'left',
    isSpotlight: false,
  },
});

export type TQuoteCardVariants = VariantProps<typeof quoteCardVariants>;
