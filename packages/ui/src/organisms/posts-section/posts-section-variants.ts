import { HEADING_ALIGN } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const postsSectionVariants = tv({
  slots: {
    root: ['mt-[22px]'],
    inner: [],
    contentGroup: [],
    label: [
      'font-mono text-label font-normal uppercase tracking-label text-subtle',
      'm-0 mb-3',
    ],
    supportingText: ['font-body text-prose text-muted', 'm-0 mb-5'],
    grid: [
      'grid',
      'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
      'gap-3.5 md:gap-5 lg:gap-7',
    ],
    titleLink: ['before:absolute before:inset-0'],
    emptyMessage: ['text-copy text-muted'],
    labelFallback: ['sr-only'],
  },
  variants: {
    tinted: {
      true: {
        root: ['mt-0 w-full py-10'],
        inner: ['mx-auto max-w-page px-gutter'],
        contentGroup: ['border-t border-border-emphasis pt-10'],
      },
    },
    wrapped: {
      true: {
        root: ['mt-0'],
      },
    },
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

export type TPostsSectionVariants = VariantProps<typeof postsSectionVariants>;
