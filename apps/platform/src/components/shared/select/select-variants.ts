import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { DISABLED_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const selectVariants = tv({
  slots: {
    trigger: [
      'flex min-h-11 w-full min-w-0 items-center justify-between gap-2.5 md:min-h-10',
      'rounded-admin-control border px-[11px] py-[3px] text-left',
      'text-admin-16 text-admin-text md:text-admin-13-5',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
      ...DISABLED_AFFORDANCE_CLASSES,
    ],
    value: ['contents'],
    icon: ['shrink-0 text-admin-muted'],
    popup: [
      'max-h-[var(--available-height)] w-[min(20rem,calc(100vw-2rem))] min-w-[var(--anchor-width)] overflow-y-auto',
      'rounded-admin border border-admin-popover-line bg-admin-popover p-1 shadow-admin-lg outline-none',
    ],
    item: [
      'flex min-h-11 cursor-pointer items-center gap-2 rounded-admin-control px-2 py-2',
      'outline-none',
      'data-[selected]:bg-admin-brand-weak',
      'data-[highlighted]:bg-admin-popover-hover data-[highlighted]:data-[selected]:bg-admin-popover-hover',
    ],
    indicator: ['w-4 shrink-0 text-admin-brand-ink'],
  },
  variants: {
    isLocked: {
      true: {
        trigger: [
          'cursor-not-allowed border-admin-control-line-locked bg-admin-bg',
        ],
      },
      false: {
        trigger: ['cursor-pointer border-admin-control-line bg-admin-surface'],
      },
    },
  },
  defaultVariants: {
    isLocked: false,
  },
});
