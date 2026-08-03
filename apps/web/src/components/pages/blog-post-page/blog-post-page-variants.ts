import { tv } from 'tailwind-variants';

export const blogPostPageVariants = tv({
  slots: {
    root: ['w-full', 'pt-6 pb-page-y'],
    hero: ['mx-auto w-full', 'max-w-page px-gutter'],
    // `body`/`footer`/`footerInRail` below all gate hidden under the SKIM
    // depth ("SKIM replaces the body with a takeaways panel") — the inverse
    // of `skimPanelVariants`' own gate, keyed off the same `DepthProvider`
    // wrapper's `data-depth` via its `/depth` named group.
    body: [
      'mx-auto w-full px-gutter',
      'mt-8',
      'group-data-[depth=SKIM]/depth:hidden',
    ],
    // The breakout-safe column — fills whatever width its own container
    // makes available (`body`'s own measure/page cap below `lg:`, or the
    // grid's column-2 track at `lg:` once `withRail` is true), with no
    // measure cap of its own. `PortableTextRenderer`'s own `Prose` root owns
    // the reading-measure cap now (nested inside this box, around each text
    // run), so a `FULL_BLEED` image — rendered as `Prose`'s sibling, not its
    // child — can fill this box's full width outright. See the `withRail`
    // variant below for the `--container-page` override that bounds a
    // `FULL_BLEED` image to this column's own rendered width once there's a
    // rail beside it (rather than the page-wide breakout it gets without one).
    content: ['w-full', 'lg:col-start-2 lg:row-start-1'],
    // Spans both grid rows so its sticky containing block reaches the
    // footer row. Mirrors `content`'s own measure below `lg:`;
    // `lg:max-w-none` frees the fixed 220px track once it's a real rail.
    rail: [
      'mx-auto max-w-measure',
      'lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:mx-0 lg:max-w-none',
    ],
    // The content→footer vertical gap comes from `Article.Footer`'s own
    // `mt-8` (see `article-footer-variants.ts`), not a grid row-gap here.
    // `text-prose` is load-bearing, not typography: `max-w-measure` is
    // `68ch` (`configs/tailwind/theme.css`), and `ch` resolves against the
    // font-size of the element it's applied to. `footerInRail` and
    // `PortableTextRenderer`'s `Prose` root are grid siblings (neither
    // nests inside the other), so nothing arbitrates a shared width between
    // them — `Prose` renders its `68ch` at its own `text-prose` (17px), so
    // without a matching override here `footerInRail` would compute its
    // `68ch` against the ambient 16px instead, landing ~38px narrower and
    // sharing a left edge with `Prose` but not a right one. Matching
    // `text-prose` here makes both edges line up exactly.
    footerInRail: [
      'mx-auto max-w-measure text-prose',
      'lg:col-start-2 lg:row-start-2 lg:mx-0',
      'group-data-[depth=SKIM]/depth:hidden',
    ],
    footer: [
      'mx-auto w-full',
      'max-w-measure px-gutter',
      'group-data-[depth=SKIM]/depth:hidden',
    ],
    coverImage: ['size-full object-cover'],
    depthToggle: ['mx-auto w-full max-w-page px-gutter', 'mb-6'],
  },
  variants: {
    // No `max-w-measure` on `body` itself: `rail`/`footerInRail` cap their
    // own width, and `content` now stays deliberately uncapped (see its own
    // comment above) — so `body` stays an unconstrained column below `lg:`
    // and becomes the two-column grid at `lg:` and up.
    withRail: {
      true: {
        body: ['lg:max-w-page', 'lg:grid lg:grid-cols-[220px_1fr] lg:gap-x-10'],
        // Scopes `ImageWithCaption`'s `FULL_BLEED` breakout math (`min(100vw,
        // var(--container-page))`, in `image-with-caption-variants.ts`) to
        // this column's own rendered width instead of the site-wide page
        // cap: with a rail, the safe width to breakout to is column 2's
        // `1fr` track, which is *narrower* than `max-w-page` by the rail's
        // own 220px + the grid's `gap-x-10` — reusing the page-wide value
        // here would still bleed a `FULL_BLEED` image left into the rail.
        // `100%` resolves against `content`'s own width at the point
        // `ImageWithCaption`'s figure actually consumes it (its own
        // `width`/`margin` percentages share that same basis, since the
        // figure is `content`'s direct child once `segmentPortableTextBody`
        // pulls a `FULL_BLEED` image out of the measure-capped `Prose` run)
        // — so the existing breakout formula ends up computing `width:
        // content`'s own width, filling column 2 exactly, no overlap.
        // Unprefixed (not `lg:`-scoped) would also cap mobile's already-
        // correct edge-to-edge breakout down to the (narrower, gutter-
        // bound) mobile `content` width — scoping to `lg:` keeps that intact,
        // since the grid (and thus the rail) only exists at `lg:` and up.
        content: ['lg:[--container-page:100%]'],
      },
      false: {
        body: ['max-w-measure'],
      },
    },
  },
  defaultVariants: {
    withRail: false,
  },
});
