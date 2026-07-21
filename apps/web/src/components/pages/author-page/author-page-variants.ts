import { tv } from 'tailwind-variants';

export const authorPageVariants = tv({
  slots: {
    root: ['bg-bg mx-auto w-full', 'max-w-page px-gutter py-page-y'],
    eyebrow: ['mb-2'],
    byline: ['mx-auto max-w-measure'],
    socialLinks: ['mx-auto mt-8 max-w-measure'],
    posts: ['mt-16'],
  },
});
