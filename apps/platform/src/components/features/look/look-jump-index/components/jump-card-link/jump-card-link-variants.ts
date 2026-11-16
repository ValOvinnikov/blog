import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { SELECTED_COMPACT_FILL_CLASSES } from '@platform/utils/selected-choice-classes/selected-choice-classes';
import { tv } from '@platform/utils/tv/tv';

export const jumpCardLinkVariants = tv({
  slots: {
    item: ['flex shrink-0'],
    link: [
      'flex items-center gap-1.5 whitespace-nowrap no-underline',
      insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    srOnly: ['sr-only'],
  },
  variants: {
    isPhone: {
      true: {
        link: [
          'h-11 rounded-platform-22 border border-platform-control-line bg-platform-surface px-3.5',
          'text-platform-13-5 font-medium text-platform-text',
        ],
      },
      false: {
        link: [
          'h-8 rounded-platform-control px-2.5 text-platform-13 font-medium text-platform-muted',
        ],
      },
    },
    isCurrent: {
      true: { link: ['font-semibold'] },
    },
  },
  compoundVariants: [
    {
      isPhone: true,
      isCurrent: true,
      class: {
        link: [
          SELECTED_COMPACT_FILL_CLASSES,
          insetFocusRingClasses(FOCUS_RING_GROUND.SELECTED_TINT),
        ],
      },
    },
    {
      isPhone: false,
      isCurrent: true,
      class: {
        link: [
          'relative text-platform-text',
          'after:pointer-events-none after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:bg-platform-selected-line',
        ],
      },
    },
    {
      isCurrent: false,
      class: {
        link: ['hover:bg-platform-hover-tint hover:text-platform-text'],
      },
    },
  ],
});
