import { tv } from 'tailwind-variants';

export const navLinkVariants = tv({
  base: [
    'inline-flex',
    'font-sans text-sm',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
  ],
  variants: {
    isActive: {
      true: 'text-accent font-medium',
      false: 'text-text-muted hover:text-accent',
    },
  },
  defaultVariants: {
    isActive: false,
  },
});
