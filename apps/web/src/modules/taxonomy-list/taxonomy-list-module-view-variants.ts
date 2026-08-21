import { HEADING_ALIGN } from '@blog/config';
import { tv } from 'tailwind-variants';

export const taxonomyListModuleViewVariants = tv({
  slots: {
    label: [
      'font-mono text-label font-normal uppercase tracking-label text-subtle',
      'm-0 mb-3',
    ],
    labelFallback: ['sr-only'],
    supportingText: ['font-body text-prose text-muted', 'm-0 mb-5'],
    emptyMessage: ['text-copy text-muted'],
  },
  variants: {
    align: {
      [HEADING_ALIGN.LEFT]: {
        label: ['text-left'],
        supportingText: ['text-left'],
      },
      [HEADING_ALIGN.CENTER]: {
        label: ['text-center'],
        supportingText: ['text-center'],
      },
      [HEADING_ALIGN.RIGHT]: {
        label: ['text-right'],
        supportingText: ['text-right'],
      },
    },
  },
  defaultVariants: { align: HEADING_ALIGN.LEFT },
});
