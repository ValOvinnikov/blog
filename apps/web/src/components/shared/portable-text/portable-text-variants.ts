import { tv } from 'tailwind-variants';

export const portableTextVariants = tv({
  slots: {
    // `lg:scroll-mt-24` matches the rail's sticky `Header` offset. Below
    // `lg:`, a jump must also clear the sticky mobile TOC strip (`top-20` +
    // its own rendered height). That strip stacks its label above the
    // selector below `md:` (~89px tall, ≈169px incl. `top-20`) and only
    // drops to a single row at `md:` (~67px tall, ≈147px incl. `top-20`) —
    // `scroll-mt-44` (176px) rounds up past the taller, stacked case, so a
    // TOC jump never lands a heading under the bar at either width.
    headingAnchor: ['scroll-mt-44', 'lg:scroll-mt-24'],
    // Rounded corners, border, and surface background come from
    // `ImageWithCaption`'s `MediaFrame` wrapper (`overflow-hidden` clips
    // this image to those corners) — only sizing belongs here, since
    // `SanityImage` renders a natural (non-`fill`) `<img>`.
    image: ['h-auto w-full'],
    bulletList: ['list-disc space-y-1 pl-5 marker:text-brand-primary'],
    numberList: ['list-decimal space-y-1 pl-5 marker:text-brand-primary'],
  },
});
