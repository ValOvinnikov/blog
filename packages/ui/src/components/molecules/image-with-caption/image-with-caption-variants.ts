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
        // No float below `md:` — a floated image with wrapped text needs more width than a phone viewport gives the remaining text.
        figure: ['w-full', 'md:float-left md:clear-left md:mr-6 md:w-2/5'],
      },
      [IMAGE_LAYOUT.FLOAT_RIGHT]: {
        figure: ['w-full', 'md:float-right md:clear-right md:ml-6 md:w-2/5'],
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
