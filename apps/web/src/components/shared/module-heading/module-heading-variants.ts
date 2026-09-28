import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const moduleHeadingVariants = tv({
  slots: {
    wrapper: ['max-w-measure text-prose'],
    label: ['m-0 mb-3'],
    supportingText: ['font-body text-prose text-muted', 'm-0 mb-5'],
  },
  variants: {
    variant: {
      label: {
        label: [
          'font-mono text-label font-normal uppercase tracking-label text-subtle',
        ],
      },
      section: {
        label: ['m-0'],
        supportingText: ['mt-3'],
      },
    },
    align: {
      [CONTENT_ALIGNMENT.LEFT]: {
        label: ['text-left'],
        supportingText: ['text-left'],
      },
      [CONTENT_ALIGNMENT.CENTER]: {
        wrapper: ['mx-auto'],
        label: ['text-center'],
        supportingText: ['text-center'],
      },
      [CONTENT_ALIGNMENT.RIGHT]: {
        wrapper: ['ml-auto'],
        label: ['text-right'],
        supportingText: ['text-right'],
      },
    },
  },
  defaultVariants: { variant: 'label', align: CONTENT_ALIGNMENT.LEFT },
});
