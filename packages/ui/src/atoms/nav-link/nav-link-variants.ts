import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const navLinkVariants = tv({
  slots: {
    root: [
      'inline-flex items-center gap-x-1.5 no-underline',
      'font-mono text-meta',
      'transition-colors duration-base ease-smooth',
      'hover:text-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    label: ['sr-only'],
  },
  variants: {
    isActive: {
      true: { root: ['text-brand-primary'] },
      false: { root: ['text-muted'] },
    },
  },
  defaultVariants: { isActive: false },
});

export type TNavLinkVariants = VariantProps<typeof navLinkVariants>;
