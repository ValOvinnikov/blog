import { tv } from '@blog/ui/lib/styling';

export const navLinkVariants = tv({
  base: [
    'inline-flex no-underline',
    'font-mono text-meta',
    'transition-colors duration-base ease-console',
    'hover:text-text',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ],
  variants: {
    isActive: {
      true: 'text-accent',
      false: 'text-subtle',
    },
  },
  defaultVariants: { isActive: false },
});
