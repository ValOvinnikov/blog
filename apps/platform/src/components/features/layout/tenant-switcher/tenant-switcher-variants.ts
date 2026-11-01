import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const tenantSwitcherVariants = tv({
  slots: {
    trigger: [
      'flex min-h-[52px] w-full items-center gap-[9px] rounded-admin-control border border-admin-side-field-line',
      'bg-admin-side-field py-2 pr-2 pl-2.5 text-left shadow-admin',
      'transition-colors duration-base ease-smooth',
      'hover:border-admin-side-accent/40',
      focusRingClasses(FOCUS_RING_GROUND.SIDE),
      'data-[popup-open]:border-admin-side-accent',
    ],
    meta: ['flex min-w-0 flex-1 flex-col'],
    nameRow: ['flex min-w-0 items-center gap-1.5'],
    name: [
      'min-w-0 flex-1 truncate text-admin-13 leading-[18px] font-semibold text-admin-text',
    ],
    domain: [
      'truncate font-admin-mono text-admin-11 leading-4 font-medium text-admin-muted',
    ],
    chev: ['shrink-0 text-admin-muted'],
    badge: ['shrink-0'],
    popup: ['w-[var(--anchor-width)]'],
    item: [
      'flex min-h-11 cursor-pointer flex-col justify-center rounded-admin-control px-2 py-1.5 outline-none md:min-h-0',
      'data-[highlighted]:bg-admin-popover-hover',
    ],
    itemNameRow: ['flex min-w-0 items-center gap-1.5'],
    itemName: [
      'min-w-0 text-admin-13 font-medium wrap-anywhere text-admin-text',
    ],
    itemDomain: [
      'font-admin-mono text-admin-11 wrap-anywhere text-admin-muted',
    ],
    itemBadge: ['shrink-0'],
  },
});
