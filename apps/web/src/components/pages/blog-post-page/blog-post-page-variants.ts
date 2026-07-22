import { tv } from 'tailwind-variants';

export const blogPostPageVariants = tv({
  slots: {
    root: ['bg-bg mx-auto w-full', 'max-w-page px-gutter py-page-y'],
    hero: ['mb-8 aspect-video w-full overflow-hidden rounded-lg'],
    heroImage: ['size-full object-cover'],
    heading: ['mb-4'],
    tags: ['mb-4'],
    meta: ['mb-8'],
    body: ['mx-auto max-w-measure'],
  },
});
