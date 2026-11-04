import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { DISABLED_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const presetSheetVariants = tv({
  slots: {
    trigger: [
      'flex min-h-14 w-full cursor-pointer items-center gap-2.5 rounded-admin-control border border-admin-control-line bg-admin-surface px-2.5 py-2 text-left',
      'data-[popup-open]:border-admin-brand-ink data-[popup-open]:shadow-admin-choice-ring',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
      ...DISABLED_AFFORDANCE_CLASSES,
    ],
    viewport: ['fixed inset-0 z-40 flex items-end'],
    popup: [
      'flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-admin-12 bg-admin-surface text-admin-text shadow-admin-sheet outline-none',
      'translate-y-(--drawer-swipe-movement-y) transition-transform duration-base ease-smooth data-[swiping]:duration-0',
      'data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full',
    ],
    handle: [
      'mx-auto mt-2 h-1 w-9 shrink-0 rounded-admin-bar bg-admin-control-line',
    ],
    header: ['flex items-center justify-between py-1.5 pr-2 pl-4'],
    title: ['text-admin-16 font-semibold'],
    close: ['border-0 bg-transparent'],
  },
});
