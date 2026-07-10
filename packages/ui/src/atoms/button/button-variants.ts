import { Size } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';

export const buttonVariants = tv({
  base: [
    'inline-flex min-h-9 items-center justify-center',
    'rounded-sm border',
    'font-display font-medium',
    'transition-colors duration-base ease-console',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      primary:
        'border-transparent bg-accent-solid text-accent-contrast hover:bg-accent-solid-hover',
      ghost:
        'border-border-strong bg-transparent text-text hover:border-accent hover:text-accent',
      link: 'border-transparent bg-transparent px-1 text-accent underline underline-offset-[3px] hover:text-accent-hover',
    },
    size: {
      [Size.SM]: 'px-3 py-1.5 text-sm',
      [Size.MD]: 'px-4 py-2 text-copy',
      [Size.LG]: 'px-5 py-2.5 text-base',
    },
  },
  defaultVariants: { variant: 'primary', size: Size.MD },
});
