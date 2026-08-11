import { HEADING_ALIGN } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const ctaModuleVariants = tv({
  slots: {
    root: [
      'flex flex-col items-start gap-3',
      'mt-[22px] px-gutter py-section',
      'bg-subtle',
    ],
    heading: ['m-0'],
    supportingText: ['m-0', 'max-w-prose', 'text-subtle'],
    action: ['mt-2'],
  },
  variants: {
    wrapped: {
      true: {
        root: ['mt-0 py-0'],
      },
    },
    align: {
      [HEADING_ALIGN.LEFT]: { root: ['items-start text-left'] },
      [HEADING_ALIGN.CENTER]: { root: ['items-center text-center'] },
      [HEADING_ALIGN.RIGHT]: { root: ['items-end text-right'] },
    },
  },
  defaultVariants: { align: HEADING_ALIGN.LEFT },
});

export type TCtaModuleVariants = VariantProps<typeof ctaModuleVariants>;
