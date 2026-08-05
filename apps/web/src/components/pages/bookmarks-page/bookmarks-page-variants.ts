import { tv } from 'tailwind-variants';

export const bookmarksPageVariants = tv({
  slots: {
    root: ['mx-auto w-full', 'max-w-page px-gutter py-page-y'],
    heading: ['mb-4'],
  },
});
