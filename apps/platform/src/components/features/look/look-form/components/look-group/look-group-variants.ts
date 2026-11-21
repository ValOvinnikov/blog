import { CAPS_LABEL_CLASSES } from '@platform/utils/caps-label-classes/caps-label-classes';
import { LOOK_ANCHOR_CLASSES } from '@platform/utils/look-anchor/look-anchor';
import { tv } from '@platform/utils/tv/tv';

export const lookGroupVariants = tv({
  slots: {
    root: [LOOK_ANCHOR_CLASSES],
    label: ['m-0 mb-2 ml-0.5 leading-platform-14', CAPS_LABEL_CLASSES],
    list: [
      'overflow-hidden rounded-platform border border-platform-line bg-platform-surface shadow-platform',
    ],
  },
});
