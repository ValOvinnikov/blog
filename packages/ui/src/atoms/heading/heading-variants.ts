import { Size } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';

export const headingVariants = tv({
  base: ['font-display font-medium text-text'],
  variants: {
    visual: {
      hero: ['text-hero leading-[1.05] tracking-tight-hero'],
      post: ['text-post-title leading-[1.07] tracking-tight-display'],
      card: ['text-card-title leading-[1.2] tracking-tight-card'],
      section: ['text-title-2xl leading-[1.2] tracking-tight-display'],
      // Deliberately smaller than `post` (text-post-title) at every viewport
      // width — roughly 0.3–0.6rem of headroom throughout — so an
      // in-article body h2 never outsizes the page's own post title.
      'prose-h2': ['text-prose-h2 leading-[1.15] tracking-[-0.015em]'],
      'prose-h3': ['text-prose-h3 leading-[1.2] tracking-[-0.01em]'],
      'prose-h4': ['text-prose-h4 leading-[1.3] tracking-[-0.005em]'],
    },
    size: {
      [Size.XS]: ['text-lg leading-tight tracking-tight'],
      [Size.SM]: ['text-xl leading-tight tracking-tight'],
      [Size.MD]: ['text-2xl leading-tight tracking-tight'],
      [Size.LG]: ['text-3xl leading-tight tracking-tight'],
      [Size.XL]: ['text-4xl leading-tight tracking-tight'],
      [Size.XXL]: ['text-display leading-[1.05] tracking-tight'],
    },
  },
});
