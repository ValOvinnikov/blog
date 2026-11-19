import { CONTENT_ALIGNMENT } from '@shinefold/config';
import { tv } from '@shinefold/ui/lib/styling';

export const moduleHeadingVariants = tv({
  slots: {
    wrapper: ['max-w-measure text-prose mb-5'],
    heading: ['m-0'],
    supportingText: ['m-0 mt-3'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: {
        heading: ['text-left'],
        supportingText: ['text-left'],
      },
      [CONTENT_ALIGNMENT.CENTER]: {
        wrapper: ['mx-auto'],
        heading: ['text-center'],
        supportingText: ['text-center'],
      },
      [CONTENT_ALIGNMENT.RIGHT]: {
        wrapper: ['ml-auto'],
        heading: ['text-right'],
        supportingText: ['text-right'],
      },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
