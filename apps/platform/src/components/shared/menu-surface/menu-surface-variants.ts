import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const MENU_GROUP_LABEL_TYPE =
  'text-platform-11 leading-platform-14 font-bold tracking-platform-label text-platform-muted uppercase';

export const MENU_POPUP_FIT_WIDTH =
  'w-max min-w-[var(--anchor-width)] max-w-[min(300px,calc(100vw-16px))]';

export const menuSurfaceVariants = tv({
  slots: {
    // Above dialogs (z-40), so a Select inside one opens over it; below toasts and tooltips (z-50).
    positioner: ['z-45'],
    popup: [
      'rounded-platform border border-platform-popover-line bg-platform-popover p-1',
      'text-platform-text shadow-platform-lg outline-none',
    ],
    item: [
      'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-platform-control px-2 py-1.5',
      'text-platform-13 font-medium text-platform-text outline-none [&+&]:mt-0.5',
      'data-[highlighted]:bg-platform-popover-hover',
      insetFocusRingClasses(FOCUS_RING_GROUND.POPOVER_HOVER),
    ],
    groupLabel: [MENU_GROUP_LABEL_TYPE, 'px-2 pt-2 pb-1'],
  },
});
