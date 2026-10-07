import { INTERACTIVE_ITEM_CARD, tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const mediaCardVariants = tv({
  slots: {
    root: [
      'relative flex h-full flex-col overflow-hidden',
      'item-card surface-card',
    ],
    media: [],
    content: ['flex flex-col flex-1', 'px-card-x py-card-y gap-2'],
    excerpt: ['text-prose leading-[1.55]', 'text-muted line-clamp-2'],
    tags: ['flex flex-wrap gap-1.5 mt-1'],
  },
  variants: {
    isSplit: {
      true: {
        root: ['md:flex-row'],
        // Stretches the media column to the text column's height by absolutely
        // filling its wrapper, instead of `MediaCardMedia`'s own aspect-ratio
        // (which would size it from its own width and leave a gap below).
        media: [
          'md:w-1/2 md:relative',
          'md:[&>div]:absolute md:[&>div]:inset-0',
        ],
        content: ['md:w-1/2 md:flex-none'],
      },
    },
    isLead: {
      true: {
        excerpt: ['line-clamp-3'],
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
