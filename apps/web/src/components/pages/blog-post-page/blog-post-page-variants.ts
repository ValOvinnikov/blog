import { tv } from 'tailwind-variants';

export const blogPostPageVariants = tv({
  slots: {
    root: ['w-full', 'pt-6 pb-page-y'],
    hero: ['mx-auto w-full', 'max-w-page px-gutter'],
    body: ['mx-auto w-full px-gutter', 'mt-8'],
    // Only reachable inside the `withRail: true` body — caps the reading
    // column back down to the measure width at every viewport, since the
    // body itself widens to `max-w-page` to make room for
    // `PostContentsRail`'s left column. Unconditional (no `lg:` prefix): the
    // reading-measure cap applies below `lg:` too, where the rail is a
    // disclosure (not a column) — only the two-column grid layout itself
    // (on `body`, not here) is `lg:`-gated.
    content: ['max-w-measure'],
    footer: ['mx-auto w-full', 'max-w-measure px-gutter'],
    coverImage: ['size-full object-cover'],
  },
  variants: {
    // `< lg`, the `withRail: true` body used to jump straight to
    // `max-w-page` — the same width as the `lg:` two-column grid — but below
    // `lg:` there's no grid columning it down: `PostContentsRail`'s mobile
    // disclosure (`w-full`) then spans the full `max-w-page` box while
    // `content` (the article text, capped to `max-w-measure` with no
    // `mx-auto` of its own) sits left-aligned inside it, so neither the rail
    // strip nor the article text reads as centered on the page. Capping
    // `body` itself to `max-w-measure` below `lg:` — widening back out to
    // `max-w-page` only at `lg:` for the grid — makes `body`'s own `mx-auto`
    // (already unconditional, in the base slot above) center a
    // `max-w-measure` box at `< lg`, so both the rail strip and `content`
    // (equal widths inside it) land centered together at the same reading
    // measure. `lg:max-w-page` plus the unchanged `lg:grid` restore the
    // original two-column layout untouched once the rail becomes a real
    // grid column instead of a stacked strip.
    withRail: {
      true: {
        body: [
          'max-w-measure',
          'lg:max-w-page',
          'lg:grid lg:grid-cols-[220px_1fr] lg:gap-x-10',
        ],
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
