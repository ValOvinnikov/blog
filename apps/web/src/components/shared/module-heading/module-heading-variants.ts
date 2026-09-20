import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const moduleHeadingVariants = tv({
  slots: {
    label: ['m-0 mb-3'],
    supportingText: ['font-body text-prose text-muted max-w-prose', 'm-0 mb-5'],
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
        label: ['text-center'],
        supportingText: ['text-center', 'mx-auto'],
      },
      [CONTENT_ALIGNMENT.RIGHT]: {
        label: ['text-right'],
        supportingText: ['text-right', 'ml-auto'],
      },
    },
  },
  defaultVariants: { variant: 'label', align: CONTENT_ALIGNMENT.LEFT },
});
