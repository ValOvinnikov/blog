import { tv } from '@platform/utils/tv/tv';

export const pageHeaderVariants = tv({
  slots: {
    root: [
      'flex flex-wrap items-start gap-4 pt-7 pb-5',
      'mt-[calc(var(--shell-gutter,0px)*-1)]',
      // Paints the surface and bottom rule out to the clipping ancestor's edges, whatever max-width the page sets.
      '[border-image:linear-gradient(to_top,var(--color-admin-line)_1px,var(--color-admin-surface)_1px)_fill_0//0_100vmax]',
    ],
    titleGroup: ['min-w-0'],
    titleRow: ['flex flex-wrap items-center gap-2.5'],
    description: ['mt-1'],
    actions: ['flex flex-wrap items-center gap-2', 'ml-auto'],
  },
});
