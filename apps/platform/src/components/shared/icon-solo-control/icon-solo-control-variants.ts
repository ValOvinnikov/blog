import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const iconSoloControlVariants = tv({
  base: [
    // md:size-11 outranks the md:h-8 of the Button this control may render.
    'inline-flex size-11 flex-none cursor-pointer items-center justify-center md:size-11 lg:size-8.5 pointer-coarse:size-11',
    'rounded-platform-5 border border-platform-control-line bg-platform-theme-track text-platform-text',
    'hover:bg-platform-hover-tint',
    'data-[pressed]:border-platform-selected-edge data-[pressed]:bg-platform-selected-tint data-[pressed]:text-platform-text',
    'data-[pressed]:hover:bg-platform-selected-tint',
    focusRingClasses(FOCUS_RING_GROUND.SURFACE),
  ],
});
