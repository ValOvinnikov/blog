import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const pageHeadingVariants = tv({
  slots: {
    root: ['mx-auto w-full', 'max-w-page px-gutter pt-page-y'],
    heading: ['mb-6'],
    supportingText: ['text-muted', 'mb-6'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: {
        heading: ['text-left'],
        supportingText: ['text-left'],
      },
      [CONTENT_ALIGNMENT.CENTER]: {
        heading: ['text-center'],
        supportingText: ['text-center'],
      },
      [CONTENT_ALIGNMENT.RIGHT]: {
        heading: ['text-right'],
        supportingText: ['text-right'],
      },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
