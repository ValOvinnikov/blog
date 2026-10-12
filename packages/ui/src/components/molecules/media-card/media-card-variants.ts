import { INTERACTIVE_ITEM_CARD, tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const mediaCardVariants = tv({
  slots: {
    root: [
      'relative isolate flex h-full flex-col overflow-hidden',
      'item-card surface-card @container',
    ],
    media: [],
    content: ['flex flex-col flex-1', 'px-card-x py-card-y gap-2'],
    excerpt: ['text-copy text-muted line-clamp-3'],
    tags: ['flex flex-wrap gap-1.5 mt-1'],
  },
  variants: {
    isSplit: {
      true: {
        root: ['md:flex-row'],
        // An absolute box keeps its aspect-ratio over its insets; drop it or a gap shows below.
        media: [
          'md:w-1/2 md:relative',
          'md:[&>div]:absolute md:[&>div]:inset-0 md:[&>div]:aspect-auto',
        ],
        content: ['md:w-1/2 md:flex-none'],
      },
    },
    isLead: {
      true: {
        excerpt: ['text-prose leading-[1.55]'],
      },
    },
    align: {
      left: {},
      center: {
        content: ['items-center text-center'],
      },
    },
    isInteractive: {
      true: {
        root: INTERACTIVE_ITEM_CARD,
      },
      false: {},
    },
  },
  defaultVariants: {
    isInteractive: false,
  },
});

export type TMediaCardVariants = VariantProps<typeof mediaCardVariants>;
