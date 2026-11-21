import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { SELECTED_STRIPE_CLASSES } from '@platform/utils/selected-choice-classes/selected-choice-classes';
import { tv } from '@platform/utils/tv/tv';

export const leadRowVariants = tv({
  slots: {
    row: [
      'flex w-full min-w-0 min-h-11 flex-col gap-1 text-left',
      'border-b border-l-[3px] border-b-platform-line-2 border-l-transparent px-[15px] py-3',
      'cursor-pointer',
    ],
    top: ['flex min-w-0 items-center gap-2'],
    dot: ['size-2 flex-none rounded-full bg-platform-brand'],
    name: ['min-w-0 flex-1 truncate text-platform-13-5 text-platform-text'],
    time: ['flex-none text-platform-12 text-platform-muted'],
    preview: ['block truncate text-platform-12-5 text-platform-muted'],
    srOnly: ['sr-only'],
  },
  variants: {
    isRead: {
      true: { name: ['font-normal'] },
      false: { name: ['font-semibold'] },
    },
    isSelected: {
      true: {
        row: [
          'relative bg-platform-surface-head hover:bg-platform-surface-head',
          SELECTED_STRIPE_CLASSES,
          'before:-left-platform-bar',
          insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE_HEAD),
        ],
      },
      false: {
        row: [
          'hover:bg-platform-hover-tint',
          insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE),
        ],
      },
    },
  },
});
