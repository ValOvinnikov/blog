import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
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
      true: {
        link: ['bg-platform-selected font-semibold text-platform-on-selected'],
      },
    },
  },
  compoundVariants: [
    {
      isPhone: true,
      isCurrent: true,
      class: { link: ['border-platform-brand'] },
    },
    {
      isPhone: false,
      isCurrent: false,
      class: { link: ['hover:bg-platform-bg hover:text-platform-text'] },
    },
  ],
});
