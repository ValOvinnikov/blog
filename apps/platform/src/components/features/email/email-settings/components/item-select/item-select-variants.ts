import { tv } from '@platform/utils/tv/tv';

export const itemSelectVariants = tv({
  slots: {
    root: ['flex', 'flex-col', 'gap-1.5', 'lg:hidden', 'xl:col-span-2'],
    label: ['text-[12.5px]', 'font-semibold', 'text-admin-text'],
    trigger: [
      'flex h-10 w-full cursor-pointer items-center justify-between gap-2',
      'rounded-admin-control border border-admin-line bg-admin-surface px-3 text-left',
      'text-[13.5px] text-admin-text',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-brand',
    ],
    value: ['min-w-0 truncate'],
    icon: ['shrink-0 text-admin-faint'],
    popup: [
      'max-h-[var(--available-height)] min-w-[var(--anchor-width)] overflow-y-auto',
      'rounded-admin border border-admin-line bg-admin-surface p-1 shadow-admin-lg outline-none',
    ],
    item: [
      'flex min-h-11 cursor-pointer items-center gap-2 rounded-admin-control px-2 py-2 md:min-h-0',
      'text-[13.5px] text-admin-text outline-none',
      'data-[highlighted]:bg-admin-surface-2',
    ],
    indicator: ['w-4 shrink-0 text-admin-brand'],
  },
});
