import { tv } from '@platform/utils/tv/tv';

export const itemSelectVariants = tv({
  slots: {
    label: ['sr-only'],
    trigger: [
      'flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2.5 sm:w-60',
      'rounded-admin-control border border-admin-control-line bg-admin-surface px-[11px] text-left',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
    ],
    value: ['flex min-w-0 flex-col leading-tight'],
    valueName: ['truncate text-[13.5px] font-semibold text-admin-text'],
    valueMeta: ['truncate text-[12px] text-admin-muted'],
    icon: ['shrink-0 text-admin-muted'],
    popup: [
      'max-h-[var(--available-height)] w-[min(20rem,calc(100vw-2rem))] min-w-[var(--anchor-width)] overflow-y-auto',
      'rounded-admin border border-admin-line bg-admin-surface p-1 shadow-admin-lg outline-none',
    ],
    item: [
      'flex min-h-11 cursor-pointer items-center gap-2 rounded-admin-control px-2 py-2',
      'outline-none',
      'data-[highlighted]:bg-admin-surface-2',
      'data-[selected]:bg-admin-brand-weak',
    ],
    indicator: ['w-4 shrink-0 text-admin-brand'],
    itemText: ['flex min-w-0 flex-1 flex-col gap-0.5'],
    itemName: ['text-[13.5px] text-admin-text'],
    itemDescription: ['text-[12px] text-admin-muted'],
    badge: ['shrink-0'],
  },
});
