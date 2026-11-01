import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const TEXT_LINK_COLOUR_CLASSES = 'text-admin-brand-ink';

export const textLinkVariants = tv({
  base: [
    'rounded-[2px] font-medium underline underline-offset-2',
    TEXT_LINK_COLOUR_CLASSES,
    focusRingClasses(FOCUS_RING_GROUND.SURFACE),
  ],
});
