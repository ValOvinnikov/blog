import { IMAGE_LAYOUT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const imageWithCaptionVariants = tv({
  slots: {
    figure: ['my-[18px]'],
  },
  variants: {
    layout: {
      [IMAGE_LAYOUT.INLINE]: {
        figure: ['w-full'],
      },
      [IMAGE_LAYOUT.FULL_BLEED]: {
        // `left/right: 50%` plus a negative margin sized off the same `min(100vw, var(--container-page))` cap cancel out to a centered box at every width; a fixed `-mx-[50vw]` paired with an uncorrelated cap breaks that cancellation.
        figure: [
          'relative left-1/2 right-1/2',
          'w-[min(100vw,var(--container-page))]',
          'mx-[calc(min(100vw,var(--container-page))*-0.5)]',
        ],
      },
      [IMAGE_LAYOUT.FLOAT_LEFT]: {
        // Padding, not margin, carries the gap: a consumer's `mx-*` on prose children zeroes a float's margins. Floats start at `lg:` so the wrapped text column stays wide enough to read.
        figure: ['w-full', 'lg:float-left lg:clear-left lg:w-48 lg:pr-6'],
      },
      [IMAGE_LAYOUT.FLOAT_RIGHT]: {
        figure: ['w-full', 'lg:float-right lg:clear-right lg:w-48 lg:pl-6'],
      },
    },
  },
  defaultVariants: {
    layout: IMAGE_LAYOUT.INLINE,
  },
});

export type TImageWithCaptionVariants = VariantProps<
  typeof imageWithCaptionVariants
>;
