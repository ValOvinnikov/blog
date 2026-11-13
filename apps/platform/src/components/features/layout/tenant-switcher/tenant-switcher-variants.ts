import { MENU_POPUP_FIT_WIDTH } from '@platform/components/shared/menu-surface';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const tenantSwitcherVariants = tv({
  slots: {
    trigger: [
      'flex min-h-[52px] w-full items-center gap-[9px] rounded-platform-control border border-platform-side-field-line',
      'bg-platform-side-field py-2 pr-2 pl-2.5 text-left shadow-platform',
      'transition-colors duration-base ease-smooth',
      'hover:border-platform-side-accent/40',
      focusRingClasses(FOCUS_RING_GROUND.SIDE),
      'data-[popup-open]:border-platform-side-accent',
    ],
    meta: ['flex min-w-0 flex-1 flex-col'],
    nameRow: ['flex min-w-0 items-center gap-1.5'],
    name: [
      'min-w-0 flex-1 truncate text-platform-13 leading-[18px] font-semibold text-platform-text',
    ],
    domain: [
      'truncate font-platform-mono text-platform-11 leading-4 font-medium text-platform-muted',
    ],
    chev: ['shrink-0 text-platform-muted'],
    badge: ['shrink-0'],
    popup: [MENU_POPUP_FIT_WIDTH],
    item: [
      'flex min-h-11 cursor-pointer flex-col justify-center rounded-platform-control px-2 py-1.5 outline-none md:min-h-0',
      'data-[highlighted]:bg-platform-popover-hover',
    ],
    itemNameRow: ['flex min-w-0 items-center gap-1.5'],
    itemName: [
      'min-w-0 text-platform-13 font-medium wrap-anywhere text-platform-text',
    ],
    itemDomain: [
      'font-platform-mono text-platform-11 wrap-anywhere text-platform-muted',
    ],
    itemBadge: ['shrink-0'],
  },
});
