import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const carouselVariants = tv({
  slots: {
    viewport: [],
    track: [
      'flex list-none m-0 p-0',
      'gap-3.5 md:gap-5 lg:gap-7',
      '[touch-action:pan-y_pinch-zoom]',
    ],
    slide: ['shrink-0 min-w-0 snap-start'],
    controls: ['flex items-center justify-center', 'gap-3 mt-5'],
  },
  variants: {
    isEnhanced: {
      true: {
        viewport: ['overflow-hidden'],
      },
      false: {
        viewport: [
          'overflow-x-auto',
          'snap-x snap-mandatory scroll-smooth motion-reduce:scroll-auto',
          '[scrollbar-width:thin]',
        ],
      },
    },
    perView: {
      1: {
        slide: ['basis-full'],
      },
      2: {
        slide: [
          'basis-[85%]',
          'sm:basis-[calc(50%-0.4375rem)]',
          'md:basis-[calc(50%-0.625rem)]',
          'lg:basis-[calc(50%-0.875rem)]',
        ],
      },
      3: {
        slide: [
          'basis-[85%]',
          'md:basis-[calc(33.333%-0.8333rem)]',
          'lg:basis-[calc(33.333%-1.1667rem)]',
        ],
      },
    },
  },
  defaultVariants: {
    isEnhanced: false,
    perView: 3,
  },
});

export type TCarouselVariants = VariantProps<typeof carouselVariants>;
