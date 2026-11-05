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
          'h-11 rounded-admin-22 border border-admin-control-line bg-admin-surface px-3.5',
          'text-admin-13-5 font-medium text-admin-text',
        ],
      },
      false: {
        link: [
          'h-8 rounded-admin-control px-2.5 text-admin-13 font-medium text-admin-muted',
        ],
      },
    },
    isCurrent: {
      true: {
        link: ['bg-admin-brand-weak font-semibold text-admin-brand-strong'],
      },
    },
  },
  compoundVariants: [
    {
      isPhone: true,
      isCurrent: true,
      class: { link: ['border-admin-brand'] },
    },
    {
      isPhone: false,
      isCurrent: false,
      class: { link: ['hover:bg-admin-bg hover:text-admin-text'] },
    },
  ],
});
