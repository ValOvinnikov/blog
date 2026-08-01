import { tv } from 'tailwind-variants';

export const portableTextRendererVariants = tv({
  slots: {
    root: ['[&>*+*]:mt-6'],
    // `lg:scroll-mt-24` matches the rail's sticky `Header` offset. Below
    // `lg:`, a jump must also clear the sticky mobile TOC strip (`top-20` +
    // its own rendered height). That strip stacks its label above the
    // selector below `md:` (~89px tall, ≈169px incl. `top-20`) and only
    // drops to a single row at `md:` (~67px tall, ≈147px incl. `top-20`) —
    // `scroll-mt-44` (176px) rounds up past the taller, stacked case (#1006)
    // so a TOC jump never lands a heading under the bar at either width.
    headingAnchor: ['scroll-mt-44', 'lg:scroll-mt-24'],
    image: ['h-auto w-full rounded-lg border border-border'],
  },
});
