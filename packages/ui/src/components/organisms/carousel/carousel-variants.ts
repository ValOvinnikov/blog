import { CONTENT_ALIGNMENT } from '@blog/config';
import {
  CARD_GUTTER_OFFSET,
  CARD_GUTTER_START,
  tv,
} from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const carouselVariants = tv({
  slots: {
    viewport: ['overflow-hidden'],
    track: [
      'flex list-none mt-0 mr-0 mb-0 p-0',
      '[touch-action:pan-y_pinch-zoom]',
    ],
    slide: ['shrink-0 min-w-0 snap-start'],
    controls: ['flex items-center justify-center', 'gap-3 mt-5'],
  },
  variants: {
    slideSize: {
      fraction: {
        track: [CARD_GUTTER_OFFSET],
        slide: ['basis-[85%] sm:basis-1/2 md:basis-1/3', CARD_GUTTER_START],
      },
      stepped: {
        track: [CARD_GUTTER_OFFSET],
        slide: ['basis-[85%] sm:basis-1/2 lg:basis-1/3', CARD_GUTTER_START],
      },
      content: {
        track: ['-ml-6'],
        slide: ['basis-auto', 'pl-6'],
      },
    },
    alignment: {
      [CONTENT_ALIGNMENT.LEFT]: { track: [] },
      [CONTENT_ALIGNMENT.CENTER]: { track: ['justify-center-safe'] },
    },
  },
  defaultVariants: {
    slideSize: 'fraction',
    alignment: CONTENT_ALIGNMENT.LEFT,
  },
});

export type TCarouselVariants = VariantProps<typeof carouselVariants>;
