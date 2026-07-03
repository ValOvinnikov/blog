import { Size } from '@blog/config';
import { tv } from 'tailwind-variants';

export const headingVariants = tv({
  base: ['font-display font-bold', 'leading-tight tracking-tight', 'text-text'],
  variants: {
    size: {
      [Size.XS]: 'text-lg',
      [Size.SM]: 'text-xl',
      [Size.MD]: 'text-2xl',
      [Size.LG]: 'text-3xl',
      [Size.XL]: 'text-4xl',
      [Size.XXL]: 'text-5xl',
    },
  },
});
