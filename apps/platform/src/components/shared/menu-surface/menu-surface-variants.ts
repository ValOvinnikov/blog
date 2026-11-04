import { tv } from '@platform/utils/tv/tv';

export const menuSurfaceVariants = tv({
  slots: {
    popup: [
      'rounded-admin border border-admin-popover-line bg-admin-popover p-1',
      'text-admin-text shadow-admin-lg outline-none',
    ],
    item: [
      'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-admin-control px-2 py-1.5',
      'text-admin-13 font-medium text-admin-text outline-none [&+&]:mt-0.5',
      'data-[highlighted]:bg-admin-popover-hover',
    ],
    groupLabel: [
      'px-2 pt-2 pb-1 text-admin-11 font-bold tracking-[.09em] text-admin-muted uppercase',
    ],
  },
});
