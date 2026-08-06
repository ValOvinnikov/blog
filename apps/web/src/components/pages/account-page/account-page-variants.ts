import { tv } from 'tailwind-variants';

export const accountPageVariants = tv({
  slots: {
    root: ['mx-auto w-full', 'max-w-page px-gutter py-page-y'],
    heading: ['mb-4'],
    sections: ['flex flex-col gap-6'],
    chrome: ['mt-6'],
  },
});
