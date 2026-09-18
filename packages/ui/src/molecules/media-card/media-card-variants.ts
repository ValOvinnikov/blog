import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const mediaCardVariants = tv({
  slots: {
    root: [
      'relative flex h-full flex-col overflow-hidden',
      'bg-surface border-l-2 border-brand-primary',
      'transition-colors duration-base ease-smooth',
      'hover:bg-brand-primary-muted focus-within:bg-brand-primary-muted',
      'motion-reduce:transition-none',
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
        media: ['md:w-1/2'],
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
  },
});

export type TMediaCardVariants = VariantProps<typeof mediaCardVariants>;
