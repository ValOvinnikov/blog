import { tv } from 'tailwind-variants';

export const portableTextRendererVariants = tv({
  slots: {
    root: ['[&>*+*]:mt-6'],
    // `lg:scroll-mt-24` matches the rail's sticky `Header` offset. Below
    // `lg:`, a jump must also clear the sticky mobile TOC strip (`top-20` +
    // ~48px bar ≈ 128px) — `scroll-mt-32` rounds up.
    headingAnchor: ['scroll-mt-32', 'lg:scroll-mt-24'],
  },
});
