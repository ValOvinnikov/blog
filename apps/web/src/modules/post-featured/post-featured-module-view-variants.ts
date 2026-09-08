import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const postFeaturedModuleViewVariants = tv({
  slots: {
    label: [
      'font-mono text-label font-normal uppercase tracking-label text-subtle',
      'm-0 mb-3',
    ],
    labelFallback: ['sr-only'],
    supportingText: ['font-body text-prose text-muted', 'm-0 mb-5'],
    leadGroup: ['flex flex-col', 'gap-3.5 md:gap-5 lg:gap-7'],
    grid: ['gap-3.5 md:gap-5 lg:gap-7'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: {
        label: ['text-left'],
        supportingText: ['text-left'],
      },
      [CONTENT_ALIGNMENT.CENTER]: {
        label: ['text-center'],
        supportingText: ['text-center'],
      },
      [CONTENT_ALIGNMENT.RIGHT]: {
        label: ['text-right'],
        supportingText: ['text-right'],
      },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
