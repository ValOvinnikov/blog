import { tv } from 'tailwind-variants';

export const blogPostPageVariants = tv({
  slots: {
    root: ['w-full', 'pt-6'],
    article: ['pb-page-y'],
    modules: ['mt-8 sm:mt-10 lg:mt-12'],
    depthToggle: ['mx-auto w-full max-w-page px-gutter', 'mb-6'],
  },
});
