import { tv } from '@platform/utils/tv/tv';

export const tenantSwitcherVariants = tv({
  slots: {
    trigger: [
      'flex w-full items-center gap-[9px] rounded-[10px] border border-admin-side-line',
      'bg-admin-side-raised px-2.5 py-2 text-left',
      'transition-colors duration-base ease-console',
      'hover:border-admin-side-accent/40',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-admin-side',
      'data-[popup-open]:border-admin-brand',
    ],
    meta: ['flex min-w-0 flex-1 flex-col'],
    nameRow: ['flex min-w-0 items-center gap-1.5'],
    name: ['min-w-0 flex-1 truncate text-[13px] font-semibold text-white'],
    domain: ['truncate font-mono text-[11px] text-admin-faint'],
    chev: ['rotate-90 text-admin-faint'],
    badge: ['shrink-0'],
    popup: [
      'min-w-56 overflow-hidden rounded-admin border border-admin-side-line',
      'bg-admin-side p-1 shadow-admin-lg outline-none',
    ],
    item: [
      'flex cursor-pointer flex-col rounded-admin-sm px-2 py-1.5 outline-none',
      'data-[highlighted]:bg-admin-side-raised',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-side-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-admin-side',
    ],
    itemNameRow: ['flex min-w-0 items-center gap-1.5'],
    itemName: ['min-w-0 flex-1 truncate text-sm text-admin-side-text'],
    itemDomain: ['font-mono text-[11px] text-admin-faint'],
    itemBadge: ['shrink-0'],
  },
});
