import { tv } from 'tailwind-variants';

export const blogPostPageVariants = tv({
  slots: {
    root: ['bg-bg mx-auto w-full', 'max-w-post px-gutter py-page-y'],
    body: ['mt-8'],
    coverImage: ['size-full object-cover'],
  },
});
