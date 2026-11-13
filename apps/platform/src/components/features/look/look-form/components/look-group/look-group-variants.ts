import { LOOK_ANCHOR_CLASSES } from '@platform/utils/look-anchor/look-anchor';
import { tv } from '@platform/utils/tv/tv';

export const LOOK_GROUP_LABEL_TEXT =
  'text-platform-11 font-semibold tracking-platform-caps text-platform-muted uppercase';

export const lookGroupVariants = tv({
  slots: {
    root: [LOOK_ANCHOR_CLASSES],
    label: ['m-0 mb-2 ml-0.5 leading-platform-14', LOOK_GROUP_LABEL_TEXT],
    list: [
      'overflow-hidden rounded-platform border border-platform-line bg-platform-surface shadow-platform',
    ],
  },
});
