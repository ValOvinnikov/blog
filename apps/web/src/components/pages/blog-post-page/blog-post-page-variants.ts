import { tv } from 'tailwind-variants';

export const blogPostPageVariants = tv({
  slots: {
    root: ['bg-bg w-full', 'py-page-y'],
    hero: ['mx-auto w-full', 'max-w-page px-gutter'],
    body: ['mx-auto w-full', 'max-w-post px-gutter', 'mt-8'],
    footer: ['mx-auto w-full', 'max-w-post px-gutter'],
    coverImage: ['size-full object-cover'],
  },
});
