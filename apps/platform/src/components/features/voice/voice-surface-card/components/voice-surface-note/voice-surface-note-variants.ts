import { tv } from '@platform/utils/tv/tv';

export const voiceSurfaceNoteVariants = tv({
  base: ['text-platform-12 leading-4 text-platform-muted'],
  variants: {
    isClosingCard: {
      true: ['lg:hidden'],
    },
  },
});
