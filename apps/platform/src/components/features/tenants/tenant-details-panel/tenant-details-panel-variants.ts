import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const tenantDetailsPanelVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    bodyStack: ['flex flex-col gap-4'],
    fields: [
      'grid grid-cols-1 gap-x-[18px] gap-y-4 lg:grid-cols-2',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    lockAnnouncementLive: ['sr-only'],
    footerActions: ['ml-auto flex items-center gap-2.5'],
  },
});
