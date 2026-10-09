import { tv } from '@platform/utils/tv/tv';

export const dashboardTenantPickerVariants = tv({
  slots: {
    list: ['flex flex-col divide-y divide-admin-line-2'],
    row: [
      'flex flex-col rounded-admin-control px-2.5 py-2 no-underline',
      'transition-colors duration-base ease-smooth hover:bg-admin-surface-2',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
    ],
    nameRow: ['flex min-w-0 items-center gap-1.5'],
    name: [
      'min-w-0 flex-1 truncate text-[13.5px] font-semibold text-admin-text',
    ],
    domain: ['truncate font-mono text-[12px] text-admin-muted'],
    badge: ['shrink-0'],
  },
});
