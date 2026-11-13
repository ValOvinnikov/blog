import { SIZE } from '@blog/config';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { HAS_DISABLED_DESCENDANT_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const checkboxVariants = tv({
  slots: {
    root: ['flex flex-col'],
    label: [
      'flex min-h-11 cursor-pointer items-start md:min-h-0',
      'text-platform-text',
      ...HAS_DISABLED_DESCENDANT_AFFORDANCE_CLASSES,
    ],
    box: [
      'mt-px flex shrink-0 cursor-pointer items-center justify-center',
      'rounded-[4px] border border-platform-control-line bg-platform-surface',
      'transition-colors duration-150',
      'data-[checked]:border-platform-brand data-[checked]:bg-platform-brand',
      'data-[disabled]:cursor-not-allowed',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    tick: ['rotate-45 border-b-2 border-r-2 border-platform-surface'],
    error: ['text-platform-bad'],
  },
  variants: {
    size: {
      [SIZE.MD]: {
        root: ['gap-[5px]'],
        label: ['gap-2 text-platform-13'],
        box: ['size-4'],
        tick: ['mb-0.5 h-2 w-1'],
        error: ['text-platform-11-5'],
      },
      [SIZE.LG]: {
        root: ['gap-1.5'],
        label: ['gap-2.5 text-platform-14 leading-platform-1-45'],
        box: ['size-4.5 aria-invalid:border-platform-bad-line'],
        tick: ['mb-0.5 h-[9px] w-[5px]'],
        error: ['text-platform-12 leading-platform-1-45 font-medium'],
      },
    },
  },
  defaultVariants: {
    size: SIZE.MD,
  },
});

export type TCheckboxVariants = VariantProps<typeof checkboxVariants>;
