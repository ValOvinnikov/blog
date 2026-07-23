import { tv } from '@blog/ui/lib/styling';

export const tagVariants = tv({
  base: [
    'inline-flex items-center',
    'rounded-sm',
    'font-mono text-xs font-medium',
    'tracking-[.06em] uppercase whitespace-nowrap',
    'px-2 py-0.5',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ],
  variants: {
    variant: {
      default: 'text-text-subtle border border-border',
      accent: 'bg-accent-muted text-accent',
    },
    interactive: {
      true: 'transition-colors duration-base ease-console',
    },
  },
  compoundVariants: [
    {
      variant: 'default',
      interactive: true,
      class: 'hover:border-accent hover:text-accent',
    },
    {
      variant: 'accent',
      interactive: true,
      class: 'hover:text-accent-hover',
    },
  ],
  defaultVariants: {
    variant: 'default',
    interactive: false,
  },
});
