import { CAPS_LABEL_CLASSES } from '@platform/utils/caps-label-classes/caps-label-classes';
import { tv } from '@platform/utils/tv/tv';

export const leadGroupVariants = tv({
  slots: {
    root: ['flex flex-col'],
    label: ['m-0 mb-2 ml-0.5 leading-platform-14', CAPS_LABEL_CLASSES],
    list: ['flex flex-col'],
  },
});
