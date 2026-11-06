import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const revealToggleVariants = tv({
  base: [
    'absolute top-1/2 right-1 -translate-y-1/2',
    'inline-flex size-9 cursor-pointer items-center justify-center md:size-7',
    'rounded-admin-control text-admin-muted outline-hidden hover:bg-admin-hover',
    focusRingClasses(FOCUS_RING_GROUND.SURFACE),
  ],
});
