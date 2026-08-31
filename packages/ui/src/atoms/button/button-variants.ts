import { SIZE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const buttonVariants = tv({
  base: [
    'inline-flex min-h-9 items-center justify-center',
    'rounded-sm border',
    'font-display font-medium',
    'transition-colors duration-base ease-console',
    'cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      primary:
        'border-transparent bg-brand-primary-solid text-brand-primary-contrast hover:bg-brand-primary-solid-hover',
      ghost:
        'border-border-strong bg-transparent text-text hover:border-brand-primary hover:text-brand-primary',
      link: 'border-transparent bg-transparent px-1 text-brand-primary underline underline-offset-[3px] hover:text-brand-primary-hover',
      danger:
        'border-error/55 bg-transparent text-error hover:border-error hover:bg-error hover:text-primary',
    },
    size: {
      [SIZE.SM]: 'px-3 py-1.5 text-sm',
      [SIZE.MD]: 'px-4 py-2 text-copy',
      [SIZE.LG]: 'px-5 py-2.5 text-base',
    },
  },
  defaultVariants: { variant: 'primary', size: SIZE.MD },
});

export type TButtonVariants = VariantProps<typeof buttonVariants>;
