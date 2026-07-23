import { tv } from 'tailwind-variants';

export const blogPostPageVariants = tv({
  slots: {
    root: ['bg-bg mx-auto w-full', 'max-w-post px-gutter py-page-y'],
    body: ['mx-auto mt-8 max-w-measure'],
    coverImage: ['size-full object-cover'],
  },
});
