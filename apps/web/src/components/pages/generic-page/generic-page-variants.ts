import { tv } from 'tailwind-variants';

export const genericPageVariants = tv({
  slots: {
    root: ['w-full'],
    heading: ['mx-auto w-full', 'max-w-page px-gutter pt-page-y', 'mb-6'],
  },
});
