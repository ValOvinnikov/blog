import { tv } from 'tailwind-variants';

export const blogPostPageVariants = tv({
  slots: {
    root: ['w-full', 'pt-6 pb-page-y'],
    hero: ['mx-auto w-full', 'max-w-page px-gutter'],
    body: ['mx-auto w-full px-gutter', 'mt-8'],
    // Caps the reading column back to measure width; `body` itself widens
    // to `max-w-page` (below) to make room for the rail's left column.
    content: ['max-w-measure'],
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
        // Mirrors `body`'s rail-column grid so the tag chips align under the
        // same content column instead of staying centered at page width;
        // `*:` pushes the single `TagList` child into the `1fr` track and
        // caps it back to measure, same as `content`. `border-t` lives on
        // `Article.Footer`'s root (the grid container itself), so it still
        // spans the full grid width — narrowing it too needs a `packages/ui`
        // change, not done here.
        footer: [
          'lg:max-w-page',
          'lg:grid lg:grid-cols-[220px_1fr] lg:gap-x-10',
          'lg:*:col-start-2 lg:*:max-w-measure',
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
