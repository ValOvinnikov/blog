import { DISABLED_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { tv } from '@platform/utils/tv/tv';

export const selectVariants = tv({
  slots: {
    trigger: [
      'flex min-h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-2.5 md:min-h-10',
      'rounded-admin-control border border-admin-control-line bg-admin-surface px-[11px] py-[3px] text-left',
      'text-admin-16 text-admin-text md:text-admin-13-5',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
      ...DISABLED_AFFORDANCE_CLASSES,
    ],
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
  },
});
