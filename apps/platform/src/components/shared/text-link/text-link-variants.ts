import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const textLinkVariants = tv({
  base: [
    'rounded-[2px] font-medium text-admin-brand-ink underline underline-offset-2',
    focusRingClasses(FOCUS_RING_GROUND.SURFACE),
  ],
});
