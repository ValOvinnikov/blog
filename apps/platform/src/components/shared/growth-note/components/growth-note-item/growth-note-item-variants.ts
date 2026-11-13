import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const growthNoteItemVariants = tv({
  slots: {
    plain: ['text-platform-13 leading-platform-19 text-platform-text'],
    link: [
      '-mx-2 flex min-h-11 flex-col gap-px rounded-platform-control px-2 py-[7px] no-underline hover:bg-platform-hover',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    name: ['text-platform-13 font-semibold text-platform-brand-ink'],
    description: ['text-platform-12 leading-platform-1-45 text-platform-muted'],
  },
});
