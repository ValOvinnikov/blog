import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const growthNoteItemVariants = tv({
  slots: {
    plain: ['text-admin-13 leading-admin-19 text-admin-text'],
    link: [
      '-mx-2 flex min-h-11 flex-col gap-px rounded-admin-control px-2 py-[7px] no-underline hover:bg-admin-hover',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    name: ['text-admin-13 font-semibold text-admin-brand-ink'],
    description: ['text-admin-12 leading-admin-1-45 text-admin-muted'],
  },
});
