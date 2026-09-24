import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const carouselVariants = tv({
  slots: {
    viewport: [],
    track: [
      'flex list-none m-0 p-0',
      '[--carousel-gap:0.875rem] md:[--carousel-gap:1.25rem] lg:[--carousel-gap:1.75rem] gap-(--carousel-gap)',
      '[--carousel-per-view:1.18] sm:[--carousel-per-view:2] md:[--carousel-per-view:3]',
      '[touch-action:pan-y_pinch-zoom]',
    ],
    slide: [
      'shrink-0 min-w-0 snap-start',
      'basis-[calc((100%-(var(--carousel-per-view)-1)*var(--carousel-gap))/var(--carousel-per-view))]',
    ],
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
  },
  defaultVariants: {
    isEnhanced: false,
  },
});

export type TCarouselVariants = VariantProps<typeof carouselVariants>;
