import { tv } from 'tailwind-variants';

export const blogPostPageVariants = tv({
  slots: {
    root: ['w-full', 'pt-6 pb-page-y'],
    depthToggle: ['mx-auto w-full max-w-page px-gutter', 'mb-6'],
  },
});
