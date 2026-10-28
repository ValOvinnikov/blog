import { tv } from '@blog/ui/lib/styling';

export const portableTextVariants = tv({
  slots: {
    // `scroll-mt-44` clears the sticky mobile TOC strip at its tallest rendered state; the `lg:` margin matches the rail's sticky offset below the measured header instead.
    headingAnchor: [
      'scroll-mt-44',
      'lg:scroll-mt-[calc(var(--site-header-height,5rem)+--spacing(6))]',
    ],
    // Sizing only — corners/border/background come from `ImageWithCaption`'s `MediaFrame` wrapper.
    image: ['h-auto w-full'],
    bulletList: ['list-disc space-y-1 pl-5'],
    numberList: ['list-decimal space-y-1 pl-5'],
  },
});
