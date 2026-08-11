import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const tagVariants = tv({
  base: [
    'inline-flex items-center',
    'rounded-sm',
    'font-mono text-xs font-medium',
    'tracking-[.06em] uppercase whitespace-nowrap',
    'px-2 py-0.5',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
  ],
  variants: {
    variant: {
      default: 'text-text-subtle border border-border',
      accent: 'bg-brand-primary-muted text-brand-primary',
    },
    interactive: {
      true: 'transition-colors duration-base ease-console',
    },
  },
  compoundVariants: [
    {
      variant: 'default',
      interactive: true,
      class: 'hover:border-brand-primary hover:text-brand-primary',
    },
    {
      variant: 'accent',
      interactive: true,
      class: 'hover:text-brand-primary-hover',
    },
  ],
  defaultVariants: {
    variant: 'default',
    interactive: false,
  },
});

export type TTagVariants = VariantProps<typeof tagVariants>;
