import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const iconToggleGroupOptionVariants = tv({
  base: [
    'inline-flex size-11 cursor-pointer items-center justify-center md:size-7.5 pointer-coarse:size-11',
    'rounded-platform-3 border-0 bg-transparent text-platform-muted',
    'hover:bg-platform-hover-tint hover:text-platform-text',
    'data-[pressed]:bg-platform-selected-tint data-[pressed]:text-platform-text',
    'data-[pressed]:hover:bg-platform-selected-tint data-[pressed]:hover:text-platform-text',
    'data-[pressed]:inset-ring data-[pressed]:inset-ring-platform-selected-edge',
    focusRingClasses(FOCUS_RING_GROUND.THEME_TRACK),
  ],
});
