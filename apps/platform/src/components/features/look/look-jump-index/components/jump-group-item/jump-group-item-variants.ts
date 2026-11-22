import { LOOK_INDEX_DIVIDER } from '@platform/components/features/look/look-jump-index/look-jump-index-variants';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { CAPS_LABEL_CLASSES } from '@platform/utils/caps-label-classes/caps-label-classes';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const jumpGroupItemVariants = tv({
  slots: {
    item: ['flex shrink-0'],
    divider: [LOOK_INDEX_DIVIDER],
    link: [
      'flex h-8 items-center rounded-platform-control pr-1.5 pl-2.5 whitespace-nowrap no-underline hover:bg-platform-hover-tint hover:text-platform-text',
      CAPS_LABEL_CLASSES,
      insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    label: ['pr-0.5 pl-1.5 whitespace-nowrap', CAPS_LABEL_CLASSES],
  },
});
