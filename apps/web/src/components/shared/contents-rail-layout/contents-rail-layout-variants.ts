import { tv } from '@blog/ui/lib/styling';

export const contentsRailLayoutVariants = tv({
  slots: {
    root: ['mx-auto w-full px-gutter'],
    content: ['w-full', 'lg:col-start-2 lg:row-start-1'],
    // `text-prose` matches `Prose`'s font-size so `max-w-measure`'s `ch` lines up with it.
    rail: [
      'mx-auto max-w-measure text-prose',
      'lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:mx-0 lg:max-w-none',
    ],
    footer: [],
  },
  variants: {
    hasRail: {
      true: {
        root: ['lg:max-w-page', 'lg:grid lg:grid-cols-[220px_1fr] lg:gap-x-10'],
        // The grid column is not viewport-centred, so a viewport-wide breakout would overflow it; a full bleed image fills the column instead.
        content: [
          'lg:[&_[data-full-bleed]_figure]:left-0',
          'lg:[&_[data-full-bleed]_figure]:w-full',
          'lg:[&_[data-full-bleed]_figure]:translate-x-0',
        ],
        footer: [
          'mx-auto text-prose',
          'max-w-measure',
          'lg:col-start-2 lg:row-start-2 lg:mx-0',
        ],
      },
      false: {
        root: ['max-w-measure'],
      },
    },
  },
  defaultVariants: {
    hasRail: false,
  },
});
