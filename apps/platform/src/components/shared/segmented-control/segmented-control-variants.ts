import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const segmentedControlVariants = tv({
  slots: {
    root: [
      'inline-flex flex-wrap items-center gap-[3px]',
      'rounded-admin-control border border-admin-control-line bg-admin-line-2 p-[3px]',
      'data-[disabled]:opacity-[.55]',
    ],
    option: [
      'min-h-11 rounded-admin-control border-0 bg-transparent px-[14px] py-[7px] md:min-h-0',
      'text-admin-13 font-medium text-admin-muted',
      'cursor-pointer disabled:cursor-not-allowed',
      focusRingClasses(FOCUS_RING_GROUND.THEME_TRACK),
      'data-[pressed]:bg-admin-surface data-[pressed]:text-admin-text data-[pressed]:not-focus-visible:shadow-admin',
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
  },
  defaultVariants: {
    hasDescriptions: false,
  },
});
