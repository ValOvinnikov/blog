import { tv } from 'tailwind-variants';

export const landingPageLayoutVariants = tv({
  slots: {
    root: ['w-full overflow-x-clip'],
    row: [
      'mx-auto w-full max-w-page px-gutter',
      'lg:grid lg:grid-cols-[220px_1fr] lg:gap-x-10',
    ],
    // `pt-page-y` matches `PageHeading`'s top padding, which opens the content column.
    sidebar: ['lg:col-start-1 lg:pt-page-y'],
    content: ['min-w-0', 'lg:col-start-2'],
  },
});
