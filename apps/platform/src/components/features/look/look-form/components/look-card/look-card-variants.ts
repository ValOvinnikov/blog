import { LOOK_ANCHOR_CLASSES } from '@platform/utils/look-anchor/look-anchor';
import { tv } from '@platform/utils/tv/tv';

export const lookCardVariants = tv({
  slots: {
    item: [LOOK_ANCHOR_CLASSES],
    body: ['@container flex flex-col gap-4'],
    description: ['leading-platform-18'],
    lockLine: ['text-platform-12-5 leading-platform-18 text-platform-text'],
  },
});
