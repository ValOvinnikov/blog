import { tv } from '@blog/ui/lib/styling';

export const navLinkVariants = tv({
  slots: {
    root: [
      'inline-flex items-center gap-x-1.5 no-underline',
      'font-mono text-meta',
      'transition-colors duration-base ease-console',
      'hover:text-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    ],
    label: ['sr-only'],
  },
  variants: {
    isActive: {
      true: { root: ['text-accent'] },
      false: { root: ['text-muted'] },
    },
  },
  defaultVariants: { isActive: false },
});
