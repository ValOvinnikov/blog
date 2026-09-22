import { tv } from 'tailwind-variants';

export const postBodyVariants = tv({
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
  },
});
