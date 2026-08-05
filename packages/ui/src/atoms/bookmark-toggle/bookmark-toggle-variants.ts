import { tv } from '@blog/ui/lib/styling';

export const bookmarkToggleVariants = tv({
  slots: {
    root: [
      'inline-flex size-11 items-center justify-center',
      'rounded-sm border border-border-strong bg-surface',
      'text-muted transition-colors duration-base ease-console',
      'cursor-pointer',
      'hover:border-accent hover:text-accent',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
      'disabled:pointer-events-none disabled:opacity-50',
    ],
    icon: ['fill-none'],
  },
  variants: {
    isBookmarked: {
      true: {
        root: 'border-accent bg-accent-muted text-accent',
        icon: 'fill-current',
      },
    },
  },
});
