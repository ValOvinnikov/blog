import { tv } from 'tailwind-variants';

export const blogPostPageVariants = tv({
  slots: {
    root: ['w-full', 'pt-6 pb-page-y'],
    hero: ['mx-auto w-full', 'max-w-page px-gutter'],
    body: ['mx-auto w-full px-gutter', 'mt-8'],
    // Caps its own measure — nesting under an already max-w-measure'd `body`
    // double-shrinks it via body's own `px-gutter`. `lg:mx-0` keeps it
    // flush-left once the grid column is narrower than the measure.
    content: ['mx-auto max-w-measure', 'lg:col-start-2 lg:row-start-1 lg:mx-0'],
    // Spans both grid rows so its sticky containing block reaches the
    // footer row. Mirrors `content`'s own measure below `lg:`;
    // `lg:max-w-none` frees the fixed 220px track once it's a real rail.
    rail: [
      'mx-auto max-w-measure',
      'lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:mx-0 lg:max-w-none',
    ],
    // The content→footer vertical gap comes from `Article.Footer`'s own
    // `mt-8` (see `article-footer-variants.ts`), not a grid row-gap here.
    footerInRail: [
      'mx-auto max-w-measure',
      'lg:col-start-2 lg:row-start-2 lg:mx-0',
    ],
    footer: ['mx-auto w-full', 'max-w-measure px-gutter'],
    coverImage: ['size-full object-cover'],
  },
  variants: {
    // No `max-w-measure` on `body` itself: `content`/`rail`/`footerInRail`
    // each cap their own width now, so `body` stays an unconstrained column
    // below `lg:` and becomes the two-column grid at `lg:` and up.
    withRail: {
      true: {
        body: ['lg:max-w-page', 'lg:grid lg:grid-cols-[220px_1fr] lg:gap-x-10'],
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
