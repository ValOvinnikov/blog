import { tv } from 'tailwind-variants';

export const blogPostPageVariants = tv({
  slots: {
    root: ['bg-bg-subtle w-full', 'pt-6 pb-page-y'],
    hero: ['mx-auto w-full', 'max-w-page px-gutter'],
    body: ['mx-auto w-full', 'max-w-measure px-gutter', 'mt-8'],
    footer: ['mx-auto w-full', 'max-w-measure px-gutter'],
    coverImage: ['size-full object-cover'],
  },
});
