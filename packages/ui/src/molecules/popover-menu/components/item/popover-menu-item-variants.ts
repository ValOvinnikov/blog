import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const popoverMenuItemVariants = tv({
  base: [
    'flex w-full items-center gap-2',
    'rounded-md px-3 py-2',
    'font-display text-sm text-text',
    'transition-colors duration-base ease-console',
    'hover:bg-surface-2 hover:text-brand-primary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
  ],
  variants: {
    variant: {
      bordered: [
        'justify-start rounded-sm border border-border-strong bg-surface px-3.5 py-2',
        'font-mono text-label text-text',
        'hover:border-brand-primary hover:bg-surface hover:text-brand-primary',
      ],
    },
  },
});

export type TPopoverMenuItemVariants = VariantProps<
  typeof popoverMenuItemVariants
>;
