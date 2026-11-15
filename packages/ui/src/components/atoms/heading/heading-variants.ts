import { SIZE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const headingVariants = tv({
  base: ['font-display font-heading text-text'],
  variants: {
    visual: {
      hero: ['text-hero heading-case'],
      post: ['text-post-title heading-case'],
      // Steps up only inside an ancestor marked `@container/card`, keeping its own line-height rather than `text-lg`'s.
      card: [
        'text-card-title @3xs/card:text-lg leading-(--text-card-title--line-height)',
      ],
      page: ['text-title-2xl heading-case'],
      section: ['text-title-section heading-case'],
      // Deliberately smaller than `post` and `section` at every viewport width, so an in-article body h2 never outsizes the page's own post title, and a MediaCard lead title never outsizes the module heading above it.
      'prose-h2': ['text-prose-h2'],
      'prose-h3': ['text-prose-h3'],
      'prose-h4': ['text-prose-h4'],
      preview: ['text-xl font-semibold'],
      copy: ['text-copy'],
    },
    size: {
      [SIZE.XS]: ['text-lg leading-tight tracking-tight'],
      [SIZE.SM]: ['text-xl leading-tight tracking-tight'],
      [SIZE.MD]: ['text-2xl leading-tight tracking-tight'],
      [SIZE.LG]: ['text-3xl leading-tight tracking-tight'],
      [SIZE.XL]: ['text-4xl leading-tight tracking-tight'],
      [SIZE.XXL]: ['text-display leading-[1.05] tracking-tight'],
    },
  },
});

export type THeadingVariants = VariantProps<typeof headingVariants>;
