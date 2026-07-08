import { Size } from '@blog/config';
import { tv } from 'tailwind-variants';

export const headingVariants = tv({
  base: ['font-display font-medium text-text'],
  variants: {
    visual: {
      hero: 'text-hero leading-[1.05] tracking-tight-hero',
      post: 'text-post-title leading-[1.07] tracking-tight-display',
      card: 'text-card-title leading-[1.2] tracking-tight-card',
      section: 'text-title-2xl leading-[1.2] tracking-tight-display',
    },
    size: {
      [Size.XS]: 'text-lg leading-tight tracking-tight',
      [Size.SM]: 'text-xl leading-tight tracking-tight',
      [Size.MD]: 'text-2xl leading-tight tracking-tight',
      [Size.LG]: 'text-3xl leading-tight tracking-tight',
      [Size.XL]: 'text-4xl leading-tight tracking-tight',
      [Size.XXL]: 'text-display leading-[1.05] tracking-tight',
    },
  },
});
