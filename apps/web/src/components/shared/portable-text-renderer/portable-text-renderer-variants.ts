import { tv } from 'tailwind-variants';

export const portableTextRendererVariants = tv({
  slots: {
    root: ['[&>*+*]:mt-6'],
    // `lg:scroll-mt-24` matches the rail's sticky `Header` offset. Below
    // `lg:`, an anchor jump must also clear the sticky mobile TOC strip
    // (~105px combined) — `scroll-mt-28` rounds up to the nearest step.
    headingAnchor: ['scroll-mt-28', 'lg:scroll-mt-24'],
  },
});
