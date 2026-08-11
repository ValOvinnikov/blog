import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const bookmarkToggleVariants = tv({
  slots: {
    root: [
      'inline-flex min-h-11 items-center gap-[0.7ch] sm:min-h-0',
      'rounded-sm border border-border-strong bg-surface px-[0.8rem] py-2',
      'font-mono text-card-copy text-muted transition-colors duration-base ease-console',
      'cursor-pointer',
      'hover:border-brand-primary hover:text-brand-primary',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
      'disabled:pointer-events-none disabled:opacity-50',
    ],
    icon: ['fill-none shrink-0'],
  },
  variants: {
    isBookmarked: {
      true: {
        root: [
          'border-brand-primary bg-brand-primary-muted text-brand-primary',
        ],
        icon: ['fill-current'],
      },
    },
  },
});

export type TBookmarkToggleVariants = VariantProps<
  typeof bookmarkToggleVariants
>;
