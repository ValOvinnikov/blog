import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { SELECT_APPEARANCE } from '@platform/constants/select-appearance';
import { DISABLED_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const selectVariants = tv({
  slots: {
    trigger: [
      'flex min-h-11 w-full min-w-0 items-center justify-between gap-2.5 md:min-h-10',
      'rounded-platform-control border px-[11px] py-[3px] text-left',
      'text-platform-16 text-platform-text md:text-platform-13-5',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
      ...DISABLED_AFFORDANCE_CLASSES,
    ],
    value: ['contents'],
    icon: ['shrink-0 text-platform-muted'],
    popup: [
      'max-h-[var(--available-height)] w-[min(20rem,calc(100vw-2rem))] min-w-[var(--anchor-width)] overflow-y-auto',
      'rounded-platform border border-platform-popover-line bg-platform-popover p-1 text-platform-text shadow-platform-lg outline-none',
    ],
    item: [
      'flex min-h-11 cursor-pointer items-center gap-2 rounded-platform-control px-2 py-2',
      'outline-none',
      'data-[selected]:bg-platform-brand-weak',
      'data-[highlighted]:bg-platform-popover-hover data-[highlighted]:data-[selected]:bg-platform-popover-hover',
    ],
    indicator: ['w-4 shrink-0 text-platform-brand-ink'],
  },
  variants: {
    appearance: {
      [SELECT_APPEARANCE.DEFAULT]: {},
      [SELECT_APPEARANCE.WIZARD]: {
        trigger: ['relative py-0 pr-10 pl-3 md:text-platform-14'],
        value: ['block min-w-0 flex-1 truncate'],
        icon: [
          'pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2',
        ],
      },
      [SELECT_APPEARANCE.COMPACT]: {
        trigger: [
          'md:h-9 md:min-h-9 md:w-auto md:min-w-55 md:gap-3 md:self-start',
          'md:py-0 md:pr-2.5 md:pl-3',
        ],
      },
    },
    isLocked: {
      true: {
        trigger: [
          'cursor-not-allowed border-platform-control-line-locked bg-platform-bg',
        ],
      },
      false: {
        trigger: [
          'cursor-pointer border-platform-control-line bg-platform-surface',
        ],
      },
    },
  },
  defaultVariants: {
    appearance: SELECT_APPEARANCE.DEFAULT,
    isLocked: false,
  },
});
