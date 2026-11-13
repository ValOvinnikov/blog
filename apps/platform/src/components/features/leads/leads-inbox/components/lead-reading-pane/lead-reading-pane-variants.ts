import { TEXT_LINK_STROKE_CLASSES } from '@platform/components/shared/text-link/text-link-variants';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const leadReadingPaneVariants = tv({
  slots: {
    root: ['flex flex-col items-start gap-4'],
    back: ['lg:hidden'],
    card: ['w-full'],
    name: [
      'break-words rounded-platform-control',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE_HEAD),
    ],
    body: ['flex flex-col gap-4'],
    email: [
      'break-all rounded-platform-control text-platform-brand',
      TEXT_LINK_STROKE_CLASSES,
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    message: ['break-words whitespace-pre-line'],
  },
});
