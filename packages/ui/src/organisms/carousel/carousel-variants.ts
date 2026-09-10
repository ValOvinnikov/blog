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
          '[&::-webkit-scrollbar]:h-1.5',
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-emphasis',
          '[&::-webkit-scrollbar-track]:bg-transparent',
        ],
      },
    },
    slideSize: {
      columns: {
        // Half/two-thirds of the track's own gap at each breakpoint
        // (gap-3.5 / md:gap-5 / lg:gap-7) so slides land flush with the grid.
        slide: [
          'basis-[85%]',
          'sm:basis-[calc(50%_-_0.4375rem)]',
          'md:basis-[calc(33.3333%_-_0.8333rem)]',
          'lg:basis-[calc(33.3333%_-_1.1667rem)]',
        ],
      },
      full: {
        slide: ['basis-full'],
      },
    },
  },
  defaultVariants: {
    isEnhanced: false,
    slideSize: 'columns',
  },
});

export type TCarouselVariants = VariantProps<typeof carouselVariants>;
