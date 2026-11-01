import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const leadsInboxVariants = tv({
  slots: {
    root: ['grid grid-cols-1 items-start gap-6 lg:grid-cols-2'],
    listColumn: [
      'min-w-0 rounded-admin',
      focusRingClasses(FOCUS_RING_GROUND.BG),
    ],
    paneColumn: [
      'min-w-0',
      'lg:sticky lg:top-admin-topbar lg:max-h-[calc(100dvh-160px)] lg:self-start lg:overflow-y-auto lg:overscroll-contain',
    ],
  },
  variants: {
    hasSelection: {
      true: { listColumn: ['hidden lg:block'] },
      false: { paneColumn: ['hidden lg:block'] },
    },
  },
});
