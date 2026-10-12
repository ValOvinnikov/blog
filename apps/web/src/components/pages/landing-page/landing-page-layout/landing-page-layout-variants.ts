import { tv } from 'tailwind-variants';

export const landingPageLayoutVariants = tv({
  slots: {
    root: ['w-full overflow-x-clip'],
    row: [
      'mx-auto w-full max-w-page',
      'lg:grid lg:grid-cols-[220px_1fr] lg:gap-x-10',
    ],
    // `pt-page-y` matches `PageHeading`'s top padding; `pb-band-md` matches a module's default bottom band at `lg`. Below `lg` the sidebar is the sticky dropdown, so padding would grow the bar.
    sidebar: ['lg:col-start-1 lg:pt-page-y lg:pb-band-md lg:pl-gutter'],
    // The grid column is not viewport-centred, so a `FULL_BLEED` breakout would overlap the sidebar; it cancels its section's gutter and fills the column instead.
    content: [
      'min-w-0',
      'lg:col-start-2',
      'lg:[&_.w-screen]:left-0',
      'lg:[&_.w-screen]:-mx-gutter',
      'lg:[&_.w-screen]:w-[calc(100%+2*var(--spacing-gutter))]',
      'lg:[&_.w-screen]:translate-x-0',
    ],
  },
});
