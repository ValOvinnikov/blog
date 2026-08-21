import { tv } from 'tailwind-variants';

export const portableTextRendererVariants = tv({
  slots: {
    // `max-w-measure` is the reading-column cap itself — it used to live on
    // `blog-post-page-variants.ts`'s `content` slot, capping *everything*
    // rendered inside it (text and images alike). Owning it here instead
    // means it only ever constrains the (possibly multiple) `Prose` runs
    // `segmentPortableTextBody` produces, never a `FULL_BLEED` `bodyImage`
    // breakout segment rendered as `Prose`'s own sibling — that segment is
    // free to fill the full width of whatever "breakout-safe" box actually
    // contains it (`content`, uncapped now). `mx-auto` centers `Prose`
    // within its parent by default; `lg:mx-0` overrides that at `lg:` so it
    // hugs the parent's left edge instead, matching the article footer's own
    // `lg:mx-0` in the contents-rail layout (`blog-post-page-variants.ts`'s
    // `footerInRail` slot) — both must align to the same column edge there.
    // A caller whose own container is already narrower than the measure
    // (e.g. `page-builder`'s `ContentModule`, capped to `max-w-prose`, or
    // the non-rail post body, capped to `max-w-measure` on its own `body`
    // slot) is unaffected either way: the narrower ancestor cap already
    // equals `Prose`'s own width, so there's no extra space for `mx-auto`/
    // `mx-0` to distribute and centering vs. left-alignment is a no-op.
    root: ['mx-auto max-w-measure', 'lg:mx-0', '[&>*+*]:mt-6'],
    // Only rendered once a body has at least one `FULL_BLEED` image
    // (`segmentPortableTextBody` returns >1 segment) — spacing between a
    // `Prose` run and its neighbouring breakout image, matching `root`'s
    // own inter-block rhythm so the vertical spacing reads the same
    // whether a paragraph→image gap crosses a segment boundary or not.
    segments: ['[&>*+*]:mt-6'],
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
  },
});
