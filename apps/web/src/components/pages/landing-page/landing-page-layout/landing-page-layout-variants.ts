import { tv } from 'tailwind-variants';

export const landingPageLayoutVariants = tv({
  slots: {
    root: ['w-full overflow-x-clip'],
    row: [
      'mx-auto w-full max-w-page px-gutter',
      'lg:grid lg:grid-cols-[220px_1fr] lg:gap-x-10',
    ],
    // `pt-page-y` matches `PageHeading`'s top padding; `pb-band-md` matches a module's default bottom band at `lg`. Below `lg` the sidebar is the sticky dropdown, so padding would grow the bar.
    sidebar: ['lg:col-start-1 lg:pt-page-y lg:pb-band-md'],
    content: ['min-w-0', 'lg:col-start-2'],
  },
});
