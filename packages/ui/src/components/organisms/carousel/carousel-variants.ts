import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
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
        track: ['-ml-[0.875rem] md:-ml-[1.25rem] lg:-ml-[1.75rem]'],
        slide: [
          'basis-[85%] sm:basis-1/2 md:basis-1/3',
          'pl-[0.875rem] md:pl-[1.25rem] lg:pl-[1.75rem]',
        ],
      },
      content: {
        track: ['-ml-6'],
        slide: ['basis-auto', 'pl-6'],
      },
    },
    alignment: {
      [CONTENT_ALIGNMENT.LEFT]: { viewport: [] },
      [CONTENT_ALIGNMENT.CENTER]: { viewport: [] },
    },
  },
  compoundVariants: [
    {
      slideSize: 'content',
      alignment: CONTENT_ALIGNMENT.CENTER,
      class: { viewport: ['mx-auto w-fit'] },
    },
    {
      slideSize: 'fraction',
      alignment: CONTENT_ALIGNMENT.CENTER,
      class: { track: ['justify-center'] },
    },
  ],
  defaultVariants: {
    slideSize: 'fraction',
    alignment: CONTENT_ALIGNMENT.LEFT,
  },
});

export type TCarouselVariants = VariantProps<typeof carouselVariants>;
