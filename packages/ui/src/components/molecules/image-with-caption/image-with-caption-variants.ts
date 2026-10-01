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
        // Centred on its parent and sized to the viewport, so the parent column must itself be viewport-centred; the root clips horizontal overflow from the scrollbar gutter that `100vw` includes.
        figure: [
          'relative left-1/2 w-screen -ml-[50vw]',
          '[html:has(&)]:overflow-x-clip',
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
