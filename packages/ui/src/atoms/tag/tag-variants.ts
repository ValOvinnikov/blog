import { tv } from '@blog/ui/lib/styling';

export const tagVariants = tv({
  base: [
    'inline-flex items-center',
    'rounded-sm',
    'font-mono text-xs font-medium',
    'tracking-[.06em] uppercase whitespace-nowrap',
    'px-2 py-0.5',
  ],
  variants: {
    variant: {
      default: 'text-text-subtle border border-border',
      accent: 'bg-accent-muted text-accent',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});
