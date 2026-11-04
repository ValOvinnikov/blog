import { DIALOG_BACKDROP_TONE } from '@platform/constants/dialog-backdrop';
import { tv } from '@platform/utils/tv/tv';

export const dialogBackdropVariants = tv({
  base: [
    'fixed inset-0 z-40',
    'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
    'transition-opacity duration-base ease-smooth',
  ],
  variants: {
    tone: {
      [DIALOG_BACKDROP_TONE.DIM]: 'bg-admin-text/50',
      [DIALOG_BACKDROP_TONE.SCRIM]: 'bg-admin-scrim',
    },
  },
});
