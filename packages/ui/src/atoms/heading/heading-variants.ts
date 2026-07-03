import { tv } from 'tailwind-variants';

export const headingVariants = tv({
  base: ['font-display font-bold', 'leading-tight tracking-tight', 'text-text'],
  variants: {
    size: {
      xs: 'text-lg',
      sm: 'text-xl',
      md: 'text-2xl',
      lg: 'text-3xl',
      xl: 'text-4xl',
      '2xl': 'text-5xl',
    },
  },
});
