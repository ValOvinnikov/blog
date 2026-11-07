import { tv } from '@platform/utils/tv/tv';

export const MENU_GROUP_LABEL_TYPE =
  'text-admin-11 leading-admin-14 font-bold tracking-admin-label text-admin-muted uppercase';

export const MENU_POPUP_FIT_WIDTH =
  'w-max min-w-[var(--anchor-width)] max-w-[min(300px,calc(100vw-16px))]';

export const menuSurfaceVariants = tv({
  slots: {
    // Above the sticky view bars (z-21), below dialogs (z-40) and toasts and tooltips (z-50).
    positioner: ['z-30'],
    popup: [
      'rounded-admin border border-admin-popover-line bg-admin-popover p-1',
      'text-admin-text shadow-admin-lg outline-none',
    ],
    item: [
      'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-admin-control px-2 py-1.5',
      'text-admin-13 font-medium text-admin-text outline-none [&+&]:mt-0.5',
      'data-[highlighted]:bg-admin-popover-hover',
    ],
    groupLabel: [MENU_GROUP_LABEL_TYPE, 'px-2 pt-2 pb-1'],
  },
});
