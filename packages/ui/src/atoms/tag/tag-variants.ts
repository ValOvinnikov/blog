import { tv } from 'tailwind-variants';

export const tagVariants = tv({
  base: [
    'inline-flex items-center rounded',
    'font-sans font-medium whitespace-nowrap',
  ],
  variants: {
    variant: {
      default: 'bg-surface-2 text-text-muted',
      accent: 'bg-accent text-bg',
    },
    size: {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});
