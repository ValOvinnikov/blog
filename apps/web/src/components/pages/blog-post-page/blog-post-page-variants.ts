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
    withRail: {
      true: {
        body: ['max-w-page', 'lg:grid lg:grid-cols-[220px_1fr] lg:gap-x-10'],
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
