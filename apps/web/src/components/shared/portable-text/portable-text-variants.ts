import { tv } from 'tailwind-variants';

export const portableTextVariants = tv({
  slots: {
    // `scroll-mt-44` clears the sticky mobile TOC strip at its tallest rendered state; `lg:scroll-mt-24` matches the rail's sticky Header offset instead.
    headingAnchor: ['scroll-mt-44', 'lg:scroll-mt-24'],
    // Sizing only — corners/border/background come from `ImageWithCaption`'s `MediaFrame` wrapper.
    image: ['h-auto w-full'],
    bulletList: ['list-disc space-y-1 pl-5 marker:text-brand-primary'],
    numberList: ['list-decimal space-y-1 pl-5 marker:text-brand-primary'],
  },
});
