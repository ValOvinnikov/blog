import { tv } from '@platform/utils/tv/tv';

export const dataTableShellVariants = tv({
  slots: {
    scrollRegion: [
      'overflow-x-auto',
      // Inset because the card's overflow-hidden would clip an offset ring.
      'outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-brand',
    ],
  },
});
