import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const segmentedControlVariants = tv({
  slots: {
    root: [
      'inline-flex flex-wrap items-center gap-[3px]',
      'rounded-admin-control border p-[3px]',
      'data-[disabled]:opacity-[.55]',
    ],
    option: [
      'min-h-11 rounded-admin-control border-0 bg-transparent px-[14px] py-[7px] md:min-h-0',
      'text-admin-13 font-medium text-admin-muted',
      'disabled:cursor-not-allowed',
      'data-[pressed]:bg-admin-surface data-[pressed]:text-admin-text',
    ],
    optionLabel: ['font-semibold'],
    optionDescription: ['font-mono text-admin-11 font-normal text-admin-muted'],
  },
  variants: {
    hasDescriptions: {
      true: {
        root: ['items-stretch'],
        option: ['flex flex-col items-start gap-px text-left'],
      },
    },
    isLocked: {
      true: {
        root: ['border-admin-control-line-locked bg-admin-bg'],
        option: [
          'cursor-not-allowed',
          focusRingClasses(FOCUS_RING_GROUND.BG),
          'data-[pressed]:not-focus-visible:shadow-[inset_0_0_0_1px_var(--admin-control-line)]',
        ],
      },
      false: {
        root: ['border-admin-control-line bg-admin-line-2'],
        option: [
          'cursor-pointer',
          focusRingClasses(FOCUS_RING_GROUND.THEME_TRACK),
          'data-[pressed]:not-focus-visible:shadow-admin',
        ],
      },
    },
  },
  defaultVariants: {
    hasDescriptions: false,
    isLocked: false,
  },
});
