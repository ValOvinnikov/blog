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
        // Breaks out to `min(100vw, max-w-page)` — capping the *same*
        // value used for the offset math (not a separate `max-w-page`
        // layered on top of a fixed `-50vw` margin) is what keeps this
        // symmetric: `left/right: 50%` shifts the box by half its
        // *containing block's* width away from its normal-flow position,
        // then `mx` pulls it back by exactly half of its own (possibly
        // capped) rendered width. When the containing block is itself
        // centered on the viewport, those two offsets cancel out to a box
        // centered on the viewport (or `max-w-page`, once that cap
        // engages) — regardless of the reading column's own width. A fixed
        // `-mx-[50vw]` paired with an uncorrelated `max-w-page` cap (the
        // previous version) breaks that cancellation, because the margin
        // is sized for the *uncapped* 100vw width while the box itself
        // renders narrower once capped.
        figure: [
          'relative left-1/2 right-1/2',
          'w-[min(100vw,var(--container-page))]',
          'mx-[calc(min(100vw,var(--container-page))*-0.5)]',
        ],
      },
      [IMAGE_LAYOUT.FLOAT_LEFT]: {
        // No float below `md:` — a floated image with wrapped text needs
        // more width than a phone viewport gives the remaining text.
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
