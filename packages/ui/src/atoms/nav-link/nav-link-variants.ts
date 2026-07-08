import { tv } from 'tailwind-variants';

export const navLinkVariants = tv({
  base: [
    'inline-flex',
    'font-mono text-meta',
    'transition-colors duration-fast ease-console',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
  ],
  variants: {
    isActive: {
      true: 'text-accent',
      false: 'text-text-subtle hover:text-text',
    },
  },
  defaultVariants: {
    isActive: false,
  },
});
