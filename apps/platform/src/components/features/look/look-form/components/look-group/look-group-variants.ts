import { LOOK_ANCHOR_CLASSES } from '@platform/utils/look-anchor/look-anchor';
import { tv } from '@platform/utils/tv/tv';

export const lookGroupVariants = tv({
  slots: {
    root: [LOOK_ANCHOR_CLASSES],
    list: [
      'overflow-hidden rounded-platform border border-platform-line bg-platform-surface shadow-platform',
    ],
  },
});
