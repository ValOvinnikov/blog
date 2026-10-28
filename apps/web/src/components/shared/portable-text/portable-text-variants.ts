import { tv } from '@blog/ui/lib/styling';

export const portableTextVariants = tv({
  slots: {
    // `scroll-mt-44` clears the sticky mobile TOC strip at its tallest rendered state; from `lg` the offset matches the rail's, below the sticky header.
    headingAnchor: [
      'scroll-mt-44',
      'lg:scroll-mt-[calc(var(--site-header-height,5rem)+1rem)]',
    ],
    // Sizing only — corners/border/background come from `ImageWithCaption`'s `MediaFrame` wrapper.
    image: ['h-auto w-full'],
    bulletList: ['list-disc space-y-1 pl-5'],
    numberList: ['list-decimal space-y-1 pl-5'],
  },
});
