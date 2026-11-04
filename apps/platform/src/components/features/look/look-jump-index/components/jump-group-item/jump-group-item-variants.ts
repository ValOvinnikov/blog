import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

const GROUP_TEXT =
  'text-admin-11 font-semibold tracking-[0.06em] text-admin-muted uppercase whitespace-nowrap';

export const jumpGroupItemVariants = tv({
  slots: {
    item: ['flex shrink-0'],
    link: [
      'flex h-8 items-center rounded-admin-control pr-1.5 pl-2.5 no-underline hover:text-admin-text',
      GROUP_TEXT,
      insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    label: ['pr-0.5 pl-1.5', GROUP_TEXT],
  },
});
