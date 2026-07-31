import { tv } from 'tailwind-variants';

export const blogPostPageVariants = tv({
  slots: {
    root: ['w-full', 'pt-6 pb-page-y'],
    hero: ['mx-auto w-full', 'max-w-page px-gutter'],
    body: ['mx-auto w-full px-gutter', 'mt-8'],
    // Caps the reading column back to measure width; `body` itself widens
    // to `max-w-page` (below) to make room for the rail's left column.
    content: ['max-w-measure', 'lg:col-start-2 lg:row-start-1'],
    // Spans both grid rows so its sticky containing block reaches the
    // footer row and the rail can descend to settle beside it.
    rail: ['lg:col-start-1 lg:row-start-1 lg:row-span-2'],
    // The content→footer vertical gap comes from `Article.Footer`'s own
    // `mt-8` (see `article-footer-variants.ts`), not a grid row-gap here.
    footerInRail: ['max-w-measure', 'lg:col-start-2 lg:row-start-2'],
    footer: ['mx-auto w-full', 'max-w-measure px-gutter'],
    coverImage: ['size-full object-cover'],
  },
  variants: {
    // Below `lg:` the rail is a stacked strip, not a grid column, so `body`
    // caps to `max-w-measure` there too (via `mx-auto`) to keep the rail
    // strip and article text centered together; `lg:max-w-page` restores
    // the wider two-column grid once the rail becomes a real grid column.
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
