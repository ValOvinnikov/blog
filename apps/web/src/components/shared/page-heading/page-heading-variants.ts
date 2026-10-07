import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const pageHeadingVariants = tv({
  slots: {
    root: [
      'w-full bg-primary-subtle border-b border-divider',
      'pt-8 pb-8 sm:pt-10 sm:pb-10 lg:pt-12 lg:pb-12',
    ],
    inner: ['mx-auto w-full max-w-page px-gutter'],
    text: ['max-w-prose'],
    heading: [],
    supportingText: ['text-muted'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: {
        text: ['mr-auto'],
        heading: ['text-left'],
        supportingText: ['text-left'],
      },
      [CONTENT_ALIGNMENT.CENTER]: {
        text: ['mx-auto'],
        heading: ['text-center'],
        supportingText: ['text-center'],
      },
      [CONTENT_ALIGNMENT.RIGHT]: {
        text: ['ml-auto'],
        heading: ['text-right'],
        supportingText: ['text-right'],
      },
    },
    hasSupportingText: {
      true: { heading: ['mb-6'] },
      false: {},
    },
  },
  defaultVariants: {
    align: CONTENT_ALIGNMENT.LEFT,
    hasSupportingText: false,
  },
});
