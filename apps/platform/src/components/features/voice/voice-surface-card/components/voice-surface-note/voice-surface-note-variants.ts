import { tv } from '@platform/utils/tv/tv';

export const voiceSurfaceNoteVariants = tv({
  base: ['text-admin-12 leading-4 text-admin-muted'],
  variants: {
    isClosingCard: {
      true: ['lg:hidden'],
    },
  },
});
