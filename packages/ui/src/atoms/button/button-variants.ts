import { Size } from '@blog/config';
import { tv } from 'tailwind-variants';

export const buttonVariants = tv({
  base: [
    'inline-flex items-center justify-center',
    'rounded-sm',
    'font-display font-medium',
    'transition-colors duration-[var(--dur-fast)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      primary: 'bg-accent text-accent-contrast hover:bg-accent-hover',
      ghost:
        'border border-border-strong bg-transparent text-text hover:bg-surface-2',
      link: 'bg-transparent text-accent underline underline-offset-[3px] hover:text-accent-hover',
    },
    size: {
      [Size.SM]: 'h-8 px-3 text-sm',
      [Size.MD]: 'h-10 px-4 text-sm',
      [Size.LG]: 'h-11 px-5 text-base',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: Size.MD,
  },
});
